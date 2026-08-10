import { useState } from "react";
import type { Attachment } from "../../types/attachment";

type Props = {
  attachment: Attachment;
  onDelete?: (id: string) => void;
};

function AttachmentCard({ attachment, onDelete }: Props) {
  const [imageError, setImageError] = useState(false);

  const apiUrl = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  const fileUrl = attachment.fileUrl.startsWith("http")
    ? attachment.fileUrl
    : `${apiUrl}${attachment.fileUrl}`;

  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";

  const fileSize =
    attachment.fileSize < 1024 * 1024
      ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
      : `${(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Preview */}
      <div className="flex h-48 items-center justify-center overflow-hidden bg-slate-100">
        {isImage && !imageError ? (
          <img
            src={fileUrl}
            alt={attachment.originalName}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => {
              console.error(
                "Attachment image failed to load:",
                fileUrl,
              );
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
            <div className="rounded-lg bg-white px-4 py-3 text-sm font-bold shadow-sm">
              {isPdf ? "PDF" : "FILE"}
            </div>

            {imageError && (
              <span className="text-xs text-red-500">
                Preview unavailable
              </span>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <h3
          className="truncate font-semibold text-slate-900"
          title={attachment.originalName}
        >
          {attachment.originalName}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {fileSize} • {attachment.mimeType}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {new Date(attachment.createdAt).toLocaleString()}
        </p>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Open
          </a>

          <a
            href={fileUrl}
            download={attachment.originalName}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Download
          </a>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(attachment.id)}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttachmentCard;