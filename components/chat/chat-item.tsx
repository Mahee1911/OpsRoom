"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Member, MemberRole, Profile } from "@prisma/client";
import axios from "axios";
import {
  Edit,
  FileIcon,
  ShieldAlert,
  ShieldCheck,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import qs from "query-string";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { useEventListener } from "@/hooks/use-event-listener";
import { useModal } from "@/hooks/use-modal-store";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    profile: Profile;
  };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

const formSchema = z.object({
  content: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export const ChatItem = ({
  socketQuery,
  socketUrl,
  member,
  deleted,
  fileUrl,
  isUpdated,
  timestamp,
  currentMember,
  id,
  content,
}: ChatItemProps) => {
  const { onOpen } = useModal();
  const router = useRouter();
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);

  const onMemberClick = () => {
    if (member.id === currentMember.id) return;

    router.push(
      `/servers/${params?.serverId}/conversations/${member.id}`
    );
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content,
    },
  });

  useEffect(() => {
    form.reset({
      content,
    });
  }, [content, form]);

  useEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.code === "Enter") {
      setIsEditing(false);
    }
  });

  // const fileType = fileUrl?.split(".").pop();

  // const isAdmin = currentMember.role === MemberRole.ADMIN;
  // const isModerator =
  //   currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;

  // const canDeleteMessage =
  //   !deleted && (isAdmin || isModerator || isOwner);
  const canDeleteMessage = true;

  const canEditMessage =
    !deleted && isOwner && !fileUrl;

  // const isPDF = fileType === "pdf" && fileUrl;
  // const isImage = !isPDF && fileUrl;
  let attachmentFileName = "";

  if (fileUrl) {
    try {
      attachmentFileName =
        new URL(fileUrl).searchParams.get("filename") ?? "";
    } catch {
      attachmentFileName = "";
    }
  }

  const isPDF =
    !!fileUrl &&
    (
      attachmentFileName.toLowerCase().endsWith(".pdf") ||
      fileUrl.toLowerCase().includes(".pdf")
    );

  const isImage = !!fileUrl && !isPDF;
  const isLoading = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      await axios.patch(url, values);

      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <div className="group relative flex w-full items-center p-4 transition hover:bg-black/5">
      <div className="flex w-full items-start gap-x-2">
        <div
          onClick={onMemberClick}
          className="cursor-pointer transition hover:drop-shadow-md"
        >
          <UserAvatar src={member.profile.imageUrl} />
        </div>

        <div className="flex w-full flex-col">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p
                onClick={onMemberClick}
                className="cursor-pointer text-sm font-semibold hover:underline"
              >
                {member.profile.name}
              </p>

              {member.role === MemberRole.MODERATOR && (
                <ActionTooltip label={member.role}>
                  <ShieldCheck className="ml-2 h-4 w-4 text-indigo-500" />
                </ActionTooltip>
              )}

              {member.role === MemberRole.ADMIN && (
                <ActionTooltip label={member.role}>
                  <ShieldAlert className="ml-2 h-4 w-4 text-rose-500" />
                </ActionTooltip>
              )}
            </div>

            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>

          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-2 flex h-48 w-48 items-center overflow-hidden rounded-md border bg-secondary aspect-square"
            >
              <Image
                src={fileUrl}
                alt={content}
                fill
                className="object-cover"
              />
            </a>
          )}

          {isPDF && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex max-w-md items-center gap-3 rounded-md border border-zinc-300 bg-zinc-100 p-3 transition hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              <FileIcon className="h-10 w-10 shrink-0 fill-red-100 stroke-red-500" />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {attachmentFileName || "PDF document"}
                </p>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Click to open PDF
                </p>
              </div>
            </a>
          )}

          {!fileUrl && !isEditing ? (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted &&
                  "mt-1 text-xs italic text-zinc-500 dark:text-zinc-400"
              )}
            >
              {content}

              {isUpdated && !deleted ? (
                <span className="mx-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              ) : null}
            </p>
          ) : null}

          {!fileUrl && isEditing ? (
            <>
              <form
                onSubmit={onSubmit}
                className="flex w-full items-center gap-x-2 pt-2"
              >
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <div className="flex-1">
                      <div className="relative w-full">
                        <Input
                          {...field}
                          disabled={isLoading}
                          className="border-0 border-none bg-zinc-200/90 p-2 text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-zinc-700/75 dark:text-zinc-200"
                          placeholder="Edited message"
                        />
                      </div>
                    </div>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="sm"
                  variant="primary"
                >
                  Save
                </Button>
              </form>

              <span className="mt-1 text-[10px] text-zinc-400">
                Press <kbd>ESC</kbd> to cancel,{" "}
                <kbd>ENTER</kbd> to save
              </span>
            </>
          ) : null}
        </div>
      </div>

      {canDeleteMessage && (
        <div className="absolute -top-2 right-5 z-10 flex items-center gap-x-1 rounded-md border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-800">
          {canEditMessage && (
            <ActionTooltip label="Edit">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit message</span>
              </button>
            </ActionTooltip>
          )}

          <ActionTooltip label="Delete">
            <button
              type="button"
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                  query: socketQuery,
                  messageId: id,
                  isMessageOwner: isOwner,
                })
              }
              className="rounded p-1 text-zinc-500 transition hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete message</span>
            </button>
          </ActionTooltip>
        </div>
      )}
    </div>
  );
};