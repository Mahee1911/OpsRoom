// import { MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";

import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "DELETE" && req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfilePages(req);

    const { content } = req.body ?? {};
    const { directMessageId, conversationId, deleteMode } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });
    if (!conversationId)
      return res.status(400).json({ error: "Conversation ID missing" });

    if (!directMessageId) {
      return res.status(400).json({
        error: "Direct Message ID missing",
      });
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          {
            memberOne: {
              profileId: profile.id,
            },
          },
          {
            memberTwo: {
              profileId: profile.id,
            },
          },
        ],
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          },
        },
        memberTwo: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    const member =
      conversation.memberOne.profileId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member) return res.status(404).json({ error: "Member not found" });

    let directMessage = await db.directMessage.findFirst({
      where: {
        id: directMessageId as string,
        conversationId: conversationId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!directMessage)
      return res.status(404).json({ error: "Message not found" });

    const isMessageOwner = directMessage.memberId === member.id;
    // const canModify = isMessageOwner;

    // if (!canModify) return res.status(401).json({ error: "Unauthorized" });

    // if (req.method === "DELETE") {
    //   directMessage = await db.directMessage.update({
    //     where: {
    //       id: directMessageId as string,
    //     },
    //     data: {
    //       fileUrl: null,
    //       content: "This message has been deleted.",
    //       deleted: true,
    //     },
    //     include: {
    //       member: {
    //         include: {
    //           profile: true,
    //         },
    //       },
    //     },
    //   });
    // }
    if (req.method === "DELETE") {
      if (deleteMode === "me") {
        await db.directMessageDeletion.upsert({
          where: {
            profileId_directMessageId: {
              profileId: profile.id,
              directMessageId: directMessage.id,
            },
          },
          update: {},
          create: {
            profileId: profile.id,
            directMessageId: directMessage.id,
          },
        });

        return res.status(200).json({
          deleteMode: "me",
          messageId: directMessage.id,
        });
      }

      if (deleteMode === "everyone") {
        if (!isMessageOwner) {
          return res.status(403).json({
            error: "Only the sender can delete this message for everyone",
          });
        }

        if (directMessage.deleted) {
          return res.status(400).json({
            error: "Message has already been deleted",
          });
        }

        directMessage = await db.directMessage.update({
          where: {
            id: directMessage.id,
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

        const updateKey = `chat:${conversationId}:messages:update`;

        res.socket.server.io?.emit(updateKey, directMessage);

        return res.status(200).json(directMessage);
      }

      return res.status(400).json({
        error: "Invalid deletion mode",
      });
    }

    // if (req.method === "PATCH") {
    //   if (!isMessageOwner)
    //     return res.status(401).json({ error: "Unauthorized" });

    //   directMessage = await db.directMessage.update({
    //     where: {
    //       id: directMessageId as string,
    //     },
    //     data: {
    //       content,
    //     },
    //     include: {
    //       member: {
    //         include: {
    //           profile: true,
    //         },
    //       },
    //     },
    //   });
    // }
    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (directMessage.deleted) {
        return res.status(400).json({
          error: "Deleted messages cannot be edited",
        });
      }

      directMessage = await db.directMessage.update({
        where: {
          id: directMessage.id,
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

      const updateKey = `chat:${conversationId}:messages:update`;

      res.socket.server.io?.emit(updateKey, directMessage);

      return res.status(200).json(directMessage);
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("[DIRECT_MESSAGES_ID]", error);

    return res.status(500).json({
      message: "Internal Error",
    });
  }
}
