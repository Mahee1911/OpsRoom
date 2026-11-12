"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
  fileUrl: z.string().min(1, {
    message: "A file is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function MessageFileModal() {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const { apiUrl, query } = data;
  const isModalOpen = isOpen && type === "messageFile";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileUrl: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const handleClose = () => {
    if (isLoading) return;

    form.reset();
    onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl ?? "",
        query,
      });

      await axios.post(url, {
        ...values,
        content: values.fileUrl,
      });

      form.reset();
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Message file upload error:", error);
    }
  });

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="overflow-hidden bg-white p-0 text-black">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            Add an attachment
          </DialogTitle>

          <DialogDescription className="text-center text-zinc-500">
            Send a file as a message
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-8 px-6">
            <Controller
              control={form.control}
              name="fileUrl"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <div className="flex w-full items-center justify-center text-center">
                    <FileUpload
                      endpoint="messageFile"
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
          </div>

          <DialogFooter className="bg-gray-100 px-6 py-4">
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}