import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { uploadAttachment } from "../../services/attachments.service";

type Props = {
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  commentId?: string;
  onUploaded?: () => void;
};

function AttachmentUploader({
  projectId,
  taskId,
  milestoneId,
  commentId,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG, WEBP and PDF files are allowed.",
      );

      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Maximum file size is 5 MB.");

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      await uploadAttachment(file, {
        projectId,
        taskId,
        milestoneId,
        commentId,
      });

      toast.success("Attachment uploaded successfully.");

      onUploaded?.();
    } catch (error: any) {
      console.error("Attachment upload error:", error);

      const message =
        error?.response?.data?.message?.[0] ??
        error?.response?.data?.message ??
        "Failed to upload attachment.";

      toast.error(message);
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Attachment"}
      </button>

      <p className="text-sm text-gray-500">
        JPG, PNG, WEBP or PDF. Maximum size: 5 MB.
      </p>
    </div>
  );
}

export default AttachmentUploader;