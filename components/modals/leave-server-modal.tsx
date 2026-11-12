"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/providers/socket-provider";

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

export function LeaveServerModal() {
  const router = useRouter();
  const { socket } = useSocket();
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "leaveServer";
  const onModalClose = () => onClose();

  const { server } = data;

  const { mutate: leaveServer, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      await axios.patch(`/api/servers/${server?.id}/leave`);
    },
    onError: console.error,
    onSuccess: () => {
      if (server?.id) {
        socket?.emit("server:refresh", server.id);
      }
    
      onClose();
      router.push("/");
      router.refresh();
    },
  });

  return (
    <Dialog open={isModalOpen} onOpenChange={onModalClose}>
      <DialogContent className="overflow-hidden p-0 text-black bg-white">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-2xl font-bold text-center">
            Leave Server
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Are you sure you want to leave{" "}
            <span className="font-semibold text-indigo-500">
              {server?.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="py-4 px-6 bg-gray-100">
          <div className="flex justify-between items-center w-full">
            <Button disabled={isLoading} onClick={onModalClose} variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              variant="primary"
              onClick={() => leaveServer()}
            >
              {isLoading ? "Leaving..." : "Confirm"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}