import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Search, Filter, Upload, Trash2, Download } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import AttachmentUploader from "../../components/attachments/AttachmentUploader";
import Pagination from "../../components/ui/Pagination";
import { getAttachments, deleteAttachment } from "../../services/attachment.service";
import type { Attachment } from "../../types/attachment";

type PagedResponse = {
  data: Attachment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const AttachmentsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showUploader, setShowUploader] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: result, isLoading, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["attachments", page, limit, searchQuery, typeFilter],
    queryFn: () => getAttachments(page, limit, { mimeType: typeFilter, search: searchQuery }),
  });

  const attachments = result?.data || [];
  const totalPages = result?.totalPages || 1;

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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Attachments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage project and task attachments
          </p>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload size={18} />
          Upload Attachment
        </button>
      </div>

      {showUploader && (
        <AttachmentUploader onUploaded={handleUploadComplete} />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search attachments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="image/">Images</option>
              <option value="application/pdf">PDFs</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {attachments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No attachments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded By</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attachments.map((attachment) => (
                  <tr key={attachment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{attachment.originalName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{attachment.mimeType}</td>
                    <td className="px-4 py-3 text-slate-600">{formatFileSize(attachment.fileSize)}</td>
                    <td className="px-4 py-3 text-slate-600">{attachment.user?.fullName || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={() => handleDelete(attachment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
};

export default AttachmentsPage;
