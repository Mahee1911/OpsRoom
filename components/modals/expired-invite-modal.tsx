"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExpiredInviteModal() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/");
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="overflow-hidden bg-white p-0 text-black">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            Invite Link Expired
          </DialogTitle>

          <DialogDescription className="text-center text-zinc-500">
            This invite link is no longer valid. Please ask a server member for
            a new invitation link.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="bg-gray-100 px-6 py-4">
          <Button
            type="button"
            className="w-full"
            onClick={handleClose}
          >
            Go Home
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}