import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type { Attachment } from "../../types/attachment";

import {
  deleteAttachment,
  getAttachments,
} from "../../services/attachment.service";

import AttachmentCard from "./AttachmentCard";

type Props = {
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  commentId?: string;
  refreshKey?: number;
};

function AttachmentList({
  projectId,
  taskId,
  milestoneId,
  commentId,
  refreshKey = 0,
}: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttachments = async () => {
    try {
      setLoading(true);

      const data = await getAttachments();

      const filtered = data.filter((attachment: Attachment) => {
        if (projectId) {
          return attachment.projectId === projectId;
        }

        if (taskId) {
          return attachment.taskId === taskId;
        }

        if (milestoneId) {
          return attachment.milestoneId === milestoneId;
        }

        if (commentId) {
          return attachment.commentId === commentId;
        }

        return true;
      });

      setAttachments(filtered);
    } catch (error) {
      console.error("Failed to load attachments:", error);
      toast.error("Failed to load attachments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAttachments();
  }, [projectId, taskId, milestoneId, commentId, refreshKey]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attachment?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAttachment(id);

      toast.success("Attachment deleted successfully.");

      setAttachments((current) =>
        current.filter((attachment) => attachment.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      toast.error("Failed to delete attachment.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
        Loading attachments...
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
        No attachments found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {attachments.map((attachment) => (
        <AttachmentCard
          key={attachment.id}
          attachment={attachment}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

export default AttachmentList;