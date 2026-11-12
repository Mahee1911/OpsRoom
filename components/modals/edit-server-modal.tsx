"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useModal } from "@/hooks/use-modal-store";

import { FileUpload } from "../file-upload";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Server name is required.",
  }),
  imageUrl: z.string().min(1, {
    message: "Server image is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function EditServerModal() {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "editServer";
  const { server } = data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (server) {
      form.reset({
        name: server.name,
        imageUrl: server.imageUrl,
      });
    }
  }, [server, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await axios.patch(`/api/servers/${server?.id}`, values);

      form.reset();
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Server update error:", error);
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
            Customize your server
          </DialogTitle>

          <DialogDescription className="text-center text-zinc-500">
            Give your server a personality with a name and an image. You can
            always change it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-8 px-6">
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <div className="flex w-full items-center justify-center">
                    <FileUpload
                      endpoint="serverImage"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>

                  {fieldState.invalid && (
                    <div className="text-center">
                      <FieldError errors={[fieldState.error]} />
                    </div>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase text-zinc-500"
                  >
                    Server name
                  </FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    disabled={isLoading}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter server name"
                    className="border-0 !bg-zinc-200 px-4 text-black placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <DialogFooter className="bg-gray-100 px-6 py-5">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full !bg-[#2563eb] text-base font-semibold !text-white hover:!bg-[#1d4ed8]"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}