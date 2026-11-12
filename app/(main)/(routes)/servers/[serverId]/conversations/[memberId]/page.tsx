import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/media-room";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface MemberIdPageProps {
  params: Promise<{
    serverId: string;
    memberId: string;
  }>;

  searchParams: Promise<{
    video?: string;
  }>;
}

export default async function MemberIdPage({
  params,
  searchParams,
}: MemberIdPageProps) {
  const { redirectToSignIn } = await auth();

  const { serverId, memberId } = await params;
  const { video } = await searchParams;

  const profile = await currentProfile();

  if (!profile) {
    return redirectToSignIn();
  }

  const currentMember = await db.member.findFirst({
    where: {
      serverId,
      profileId: profile.id,
    },
    include: {
      profile: true,
    },
  });

  if (!currentMember) {
    return redirect("/");
  }

  const selectedMember = await db.member.findFirst({
    where: {
      id: memberId,
      serverId,
    },
  });

  if (!selectedMember) {
    return redirect(`/servers/${serverId}`);
  }

  if (selectedMember.id === currentMember.id) {
    return redirect(`/servers/${serverId}`);
  }

  const conversation = await getOrCreateConversation(
    currentMember.id,
    selectedMember.id
  );

  if (!conversation) {
    return redirect(`/servers/${serverId}`);
  }

  const { memberOne, memberTwo } = conversation;

  const otherMember =
    memberOne.profileId === profile.id ? memberTwo : memberOne;

  const isVideoCall = video === "true";

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#313338]">
      <ChatHeader
        imageUrl={otherMember.profile.imageUrl}
        name={otherMember.profile.name}
        type="conversation"
        serverId={serverId}
      />

      {isVideoCall ? (
        <MediaRoom
          chatId={conversation.id}
          audio
          video
        />
      ) : (
        <>
          <ChatMessages
            member={currentMember}
            name={otherMember.profile.name}
            chatId={conversation.id}
            type="conversation"
            apiUrl="/api/direct-messages"
            paramKey="conversationId"
            paramValue={conversation.id}
            socketUrl="/api/socket/direct-messages"
            socketQuery={{
              conversationId: conversation.id,
            }}
          />

          <ChatInput
            name={otherMember.profile.name}
            type="conversation"
            apiUrl="/api/socket/direct-messages"
            query={{
              conversationId: conversation.id,
            }}
          />
        </>
      )}
    </div>
  );
}