"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { EmojiPicker } from "@/components/emoji-picker";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z.object({
  content: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export const ChatInput = ({
  name,
  query,
  apiUrl,
  type,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, values);

      form.reset();
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Controller
        control={form.control}
        name="content"
        render={({ field }) => (
          <div className="relative p-4 pb-6">
            <button
              type="button"
              onClick={() =>
                onOpen("messageFile", {
                  apiUrl,
                  query,
                })
              }
              className="absolute top-7 left-8 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-zinc-500 p-1 transition hover:bg-zinc-600 dark:bg-zinc-400 dark:hover:bg-zinc-300"
            >
              <Plus className="text-white dark:text-[#313338]" />
            </button>

            <Input
              {...field}
              disabled={isLoading}
              className="border-0 border-none bg-zinc-200/90 px-14 py-6 text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-zinc-700/75 dark:text-zinc-200"
              placeholder={`Message ${
                type === "conversation" ? name : `#${name}`
              }`}
            />

            <div className="absolute top-7 right-8">
              <EmojiPicker
                onChange={(emoji) =>
                  field.onChange(`${field.value}${emoji}`)
                }
              />
            </div>
          </div>
        )}
      />
    </form>
  );
};