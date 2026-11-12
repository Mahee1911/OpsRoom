"use client";

import "@uploadthing/react/styles.css";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { UploadDropzone } from "@/lib/uploadthing";

interface FileUploadProps {
  endpoint: "messageFile" | "serverImage";
  onChange: (url?: string) => void;
  value: string;
}

export const FileUpload = ({
  onChange,
  value,
  endpoint,
}: FileUploadProps) => {
  const [uploadedFileName, setUploadedFileName] = useState("");

  let storedFileName = "";

  if (value && endpoint === "messageFile") {
    try {
      storedFileName =
        new URL(value).searchParams.get("filename") ?? "";
    } catch {
      storedFileName = "";
    }
  }

  const fileName = uploadedFileName || storedFileName;

  const removeFile = () => {
    setUploadedFileName("");
    onChange("");
  };

  // Round preview for server/profile images.
  if (value && endpoint === "serverImage") {
    return (
      <div className="relative h-32 w-32 shrink-0">
        <Image
          fill
          src={value}
          alt="Uploaded server image"
          sizes="128px"
          className="rounded-full object-cover"
        />

        <button
          type="button"
          onClick={removeFile}
          className="absolute -right-2 -top-2 z-10 rounded-full bg-rose-500 p-1.5 text-white shadow-md transition hover:bg-rose-600"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove image</span>
        </button>
      </div>
    );
  }

  // Rectangular attachment preview for message files.
  if (value && endpoint === "messageFile") {
    return (
      <div className="relative mt-2 flex w-full min-w-0 items-center rounded-md bg-zinc-200 px-4 py-3">
        <FileIcon className="h-10 w-10 shrink-0 fill-indigo-200 stroke-indigo-500" />

        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 min-w-0 flex-1 truncate text-sm font-medium text-indigo-500 hover:underline"
          title={fileName || "Uploaded attachment"}
        >
          {fileName || "Uploaded attachment"}
        </a>

        <button
          type="button"
          onClick={removeFile}
          className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1.5 text-white shadow-md transition hover:bg-rose-600"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove attachment</span>
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        const uploadedFile = res?.[0];

        if (!uploadedFile) return;

        if (endpoint === "messageFile") {
          const separator = uploadedFile.url.includes("?")
            ? "&"
            : "?";

          const urlWithFileName =
            `${uploadedFile.url}${separator}filename=${encodeURIComponent(
              uploadedFile.name || "Uploaded attachment"
            )}`;

          setUploadedFileName(
            uploadedFile.name || "Uploaded attachment"
          );

          onChange(urlWithFileName);
          return;
        }

        // Do not modify server image URLs.
        onChange(uploadedFile.url);
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
      }}
    />
  );
};