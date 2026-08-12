import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Search, Filter, Upload, Trash2, Download, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import AttachmentUploader from "../../components/attachments/AttachmentUploader";
import { getAttachments, deleteAttachment } from "../../services/attachment.service";
import type { Attachment } from "../../types/attachment";

const AttachmentsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showUploader, setShowUploader] = useState(false);

  const { data: attachments = [], isLoading, isError, refetch } = useQuery<Attachment[]>({
    queryKey: ["attachments"],
    queryFn: () => getAttachments(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast.success("Attachment deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete attachment");
    },
  });

  const filteredAttachments = attachments.filter((attachment) => {
    const matchesSearch =
      attachment.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attachment.mimeType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || attachment.mimeType.startsWith(typeFilter);

    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this attachment?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    refetch();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const typeStats = {
    image: attachments.filter(a => a.mimeType.startsWith("image/")).length,
    pdf: attachments.filter(a => a.mimeType === "application/pdf").length,
    other: attachments.filter(a => !a.mimeType.startsWith("image/") && a.mimeType !== "application/pdf").length,
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load attachments</h2>
        <p className="mt-1 text-sm text-red-600">The attachments service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Attachments
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage all files and documents
          </p>
        </div>

        <button
          onClick={() => setShowUploader(!showUploader)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          Upload Attachment
        </button>
      </div>

      {showUploader && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Upload New Attachment</h3>
            <button
              onClick={() => setShowUploader(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <AttachmentUploader onUploaded={handleUploadComplete} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Files
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {attachments.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <Paperclip className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Images
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {typeStats.image}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <Paperclip className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                PDFs
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {typeStats.pdf}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50">
              <Paperclip className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search attachments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="application/pdf">PDFs</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredAttachments.length === 0 ? (
            <div className="text-center py-12">
              <Paperclip className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No attachments found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first attachment to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAttachments.map((attachment) => {
                const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
                const fileUrl = attachment.fileUrl.startsWith("http")
                  ? attachment.fileUrl
                  : `${apiUrl}${attachment.fileUrl}`;

                return (
                  <div
                    key={attachment.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex h-32 items-center justify-center overflow-hidden bg-slate-100">
                      {attachment.mimeType.startsWith("image/") ? (
                        <img
                          src={fileUrl}
                          alt={attachment.originalName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <div className="rounded-lg bg-white px-4 py-3 text-sm font-bold shadow-sm">
                            {attachment.mimeType === "application/pdf" ? "PDF" : "FILE"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3
                        className="truncate font-semibold text-slate-900 text-sm"
                        title={attachment.originalName}
                      >
                        {attachment.originalName}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>

                        <a
                          href={fileUrl}
                          download={attachment.originalName}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>

                        <button
                          onClick={() => handleDelete(attachment.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentsPage;