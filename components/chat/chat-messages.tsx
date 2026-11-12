"use client";

import { Member, Message, Profile } from "@prisma/client";
import { format } from "date-fns";
import { Loader2, ServerCrash } from "lucide-react";
import { Fragment, useRef } from "react";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useChatSocket } from "@/hooks/use-chat-socket";

import { ChatItem } from "./chat-item";
import { ChatWelcome } from "./chat-welcome";

interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "channel" | "conversation";
}

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  };
};

type ChatPage = {
  items: MessageWithMemberWithProfile[];
  nextCursor?: string | null;
};

const DATE_FORMAT = "d MMM yyyy, HH:mm";

export const ChatMessages = ({
  apiUrl,
  type,
  name,
  chatId,
  member,
  paramKey,
  socketUrl,
  paramValue,
  socketQuery,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<HTMLDivElement>(null!);
  const bottomRef = useRef<HTMLDivElement>(null!);

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    status,
    hasNextPage,
  } = useChatQuery({
    queryKey,
    apiUrl,
    paramKey,
    paramValue,
  });

  const pages = data?.pages as ChatPage[] | undefined;

  useChatSocket({
    queryKey,
    addKey,
    updateKey,
  });

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: () => {
      void fetchNextPage();
    },
    shouldLoadMore:
      !isFetchingNextPage && !!hasNextPage,
    count: pages?.[0]?.items.length ?? 0,
  });

  if (status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <Loader2 className="my-4 h-7 w-7 animate-spin text-zinc-500" />

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading messages...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <ServerCrash className="my-4 h-7 w-7 text-zinc-500" />

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={chatRef}
      className="flex flex-1 flex-col overflow-y-auto py-4"
    >
      {!hasNextPage ? <div className="flex-1" /> : null}

      {!hasNextPage ? (
        <ChatWelcome type={type} name={name} />
      ) : null}

      {hasNextPage ? (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="my-4 h-6 w-6 animate-spin text-zinc-500" />
          ) : (
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              className="my-4 text-xs text-zinc-500 transition hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Load previous messages
            </button>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col-reverse">
        {pages?.map((group, index) => (
          <Fragment key={index}>
            {group.items.map((message) => (
              <ChatItem
                key={message.id}
                id={message.id}
                currentMember={member}
                member={message.member}
                content={message.content}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                timestamp={format(
                  new Date(message.createdAt),
                  DATE_FORMAT
                )}
                isUpdated={
                  message.updatedAt !== message.createdAt
                }
                socketUrl={socketUrl}
                socketQuery={socketQuery}
              />
            ))}
          </Fragment>
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
};