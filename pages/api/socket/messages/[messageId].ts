// import { MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";

import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "DELETE" && req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfilePages(req);

    const { content } = req.body ?? {};
    // const { serverId, channelId, messageId } = req.query;
    const {
      serverId,
      channelId,
      messageId,
      deleteMode,
    } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });
    if (!serverId) return res.status(400).json({ error: "Server ID missing" });
    if (!channelId)
      return res.status(400).json({ error: "Channel ID missing" });

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) return res.status(404).json({ error: "Server not found" });

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });

    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const member = server.members.find(
      (member) => member.profileId === profile.id
    );

    if (!member) return res.status(404).json({ error: "Member not found" });

    let message = await db.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    
    if (!message) {
      return res.status(404).json({
        error: "Message not found",
      });
    }

    const isMessageOwner = message.memberId === member.id;
    // const isAdmin = (member.role === MemberRole.ADMIN);
    // const isModerator = (member.role === MemberRole.MODERATOR);
    // const canModify = isMessageOwner || isAdmin || isModerator;

    // if (!canModify) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "DELETE") {
      if (deleteMode === "me") {
        await db.messageDeletion.upsert({
          where: {
            profileId_messageId: {
              profileId: profile.id,
              messageId: message.id,
            },
          },
          update: {},
          create: {
            profileId: profile.id,
            messageId: message.id,
          },
        });
    
        return res.status(200).json({
          deleteMode: "me",
          messageId: message.id,
        });
      }
    
      if (deleteMode === "everyone") {
        if (!isMessageOwner) {
          return res.status(403).json({
            error:
              "Only the sender can delete this message for everyone",
          });
        }
    
        if (message.deleted) {
          return res.status(400).json({
            error: "Message has already been deleted",
          });
        }
    
        message = await db.message.update({
          where: {
            id: message.id,
          },
          data: {
            fileUrl: null,
            content: "This message has been deleted.",
            deleted: true,
          },
          include: {
            member: {
              include: {
                profile: true,
              },
            },
          },
        });
    
        const updateKey =
          `chat:${channelId}:messages:update`;
    
        res.socket.server.io?.emit(updateKey, message);
    
        return res.status(200).json(message);
      }
    
      return res.status(400).json({
        error: "Invalid deletion mode",
      });
    }

    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }
    
      if (message.deleted) {
        return res.status(400).json({
          error: "Deleted messages cannot be edited",
        });
      }
    
      message = await db.message.update({
        where: {
          id: message.id,
        },
        data: {
          content,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
      });
    
      const updateKey =
      `chat:${channelId}:messages:update`;

    res.socket.server.io?.emit(
      updateKey,
      message
    );

    return res.status(200).json(message);
  }

  return res.status(405).json({
    error: "Method not allowed",
  });
} catch (error) {
  console.error("[MESSAGES_ID]", error);

  return res.status(500).json({
    message: "Internal Error",
  });
}
}