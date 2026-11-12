"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

import { useSocket } from "@/components/providers/socket-provider";

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
}

interface MessagePage {
  nextCursor?: string | null;
  [key: string]: unknown;
}

export const useChatQuery = ({
  queryKey,
  apiUrl,
  paramKey,
  paramValue,
}: ChatQueryProps) => {
  const { isConnected } = useSocket();

  const fetchMessages = async ({
    pageParam,
  }: {
    pageParam: string | undefined;
  }): Promise<MessagePage> => {
    const url = qs.stringifyUrl(
      {
        url: apiUrl,
        query: {
          cursor: pageParam,
          [paramKey]: paramValue,
        },
      },
      {
        skipNull: true,
      }
    );

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Failed to fetch messages.");
    }

    return res.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: fetchMessages,

    // Required in TanStack Query v5
    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor ?? undefined;
    },

    refetchInterval: isConnected ? false : 1000,
  });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};