"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import qs from "query-string";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";

type DeleteMode = "me" | "everyone";

export function DeleteMessageModal() {
  const { isOpen, onClose, type, data } = useModal();
  const queryClient = useQueryClient();

  const isModalOpen = isOpen && type === "deleteMessage";

  const {
    apiUrl,
    query,
    messageId,
    isMessageOwner,
  } = data;

  const chatId =
    query?.channelId ?? query?.conversationId;

  const chatQueryKey =
    chatId ? `chat:${chatId}` : undefined;

  const removeFromLocalCache = () => {
    if (!chatQueryKey || !messageId) return;

    queryClient.setQueryData(
      [chatQueryKey],
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.filter(
              (message: { id: string }) =>
                message.id !== messageId
            ),
          })),
        };
      }
    );
  };

  const {
    mutate: deleteMessage,
    isPending: isLoading,
    variables: activeMode,
  } = useMutation({
    mutationFn: async (deleteMode: DeleteMode) => {
      const url = qs.stringifyUrl({
        url: apiUrl ?? "",
        query: {
          ...query,
          deleteMode,
        },
      });

      const response = await axios.delete(url);

      return {
        deleteMode,
        data: response.data,
      };
    },

    onSuccess: ({ deleteMode }) => {
      if (deleteMode === "me") {
        removeFromLocalCache();
      }

      onClose();
    },

    onError: (error) => {
      console.error("Delete message error:", error);
    },
  });

  const onModalClose = () => {
    if (isLoading) return;

    onClose();
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) onModalClose();
      }}
    >
      <DialogContent className="overflow-hidden bg-white p-0 text-black">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            Delete Message
          </DialogTitle>

          <DialogDescription className="text-center text-zinc-500">
            Choose how you want to delete this message.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex w-full flex-col gap-2">
            {isMessageOwner && (
              <Button
                disabled={isLoading}
                variant="primary"
                className="w-full"
                onClick={() =>
                  deleteMessage("everyone")
                }
              >
                {isLoading &&
                activeMode === "everyone"
                  ? "Deleting..."
                  : "Delete for everyone"}
              </Button>
            )}

            <Button
              disabled={isLoading}
              variant="secondary"
              className="w-full"
              onClick={() => deleteMessage("me")}
            >
              {isLoading && activeMode === "me"
                ? "Deleting..."
                : "Delete for me"}
            </Button>

            <Button
              disabled={isLoading}
              variant="ghost"
              className="w-full"
              onClick={onModalClose}
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}