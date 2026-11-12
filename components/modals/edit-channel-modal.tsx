"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChannelType } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useSocket } from "@/components/providers/socket-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Channel name is required.",
    })
    .refine((name) => name.toLowerCase() !== "general", {
      message: "Channel name cannot be 'general'.",
    }),

  type: z.nativeEnum(ChannelType),
});

type FormValues = z.infer<typeof formSchema>;

export function EditChannelModal() {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();
  const { socket } = useSocket();

  const isModalOpen = isOpen && type === "editChannel";
  const { channel, server } = data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: ChannelType.TEXT,
    },
  });

  useEffect(() => {
    if (channel) {
      form.reset({
        name: channel.name,
        type: channel.type,
      });
    }
  }, [channel, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const url = qs.stringifyUrl({
        url: `/api/channels/${channel?.id}`,
        query: {
          serverId: server?.id,
        },
      });

      await axios.patch(url, values);

      if (server?.id) {
        socket?.emit("server:refresh", server.id);
      }
      form.reset();
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Channel update error:", error);
    }
  });

  const onModalClose = () => {
    if (isLoading) return;

    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) onModalClose();
      }}
    >
      <DialogContent
        className="fixed left-1/2 top-1/2 overflow-hidden bg-white p-0 text-black"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            Edit Channel
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-8 px-6">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase text-zinc-500"
                  >
                    Channel name
                  </FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    disabled={isLoading}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter channel name"
                    className="border-0 !bg-zinc-200 px-4 text-black placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs font-bold uppercase text-zinc-500">
                    Channel type
                  </FieldLabel>

                  <Select
                    disabled={isLoading}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value as ChannelType);
                    }}
                  >
                    <SelectTrigger className="w-full border-0 !bg-zinc-200 text-black capitalize ring-0 focus:ring-0">
                      <SelectValue placeholder="Select a channel type" />
                    </SelectTrigger>

                    <SelectContent>
                      {Object.values(ChannelType).map((channelTypeValue) => (
                        <SelectItem
                          key={channelTypeValue}
                          value={channelTypeValue}
                          className="capitalize"
                        >
                          {channelTypeValue.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <DialogFooter className="m-0! bg-gray-100 px-6 py-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-md bg-indigo-500 font-semibold text-white hover:bg-indigo-600"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}