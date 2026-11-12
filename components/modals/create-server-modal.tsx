"use client";

import axios from "axios";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export function CreateServerModal() {
  const { isOpen, onClose, type } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "createServer";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await axios.post("/api/servers", values);

      form.reset();
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Server creation error:", error);
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
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}