import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";

import CommentForm from "../../components/comments/CommentForm";
import { commentService } from "../../services/comment.service";

import { mapServerValidationErrors } from "../../features/validation/errors";

export default function AddCommentPage() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (
    data: { content: string }
  ) => {
    setServerErrors({});
    try {

      setLoading(true);

      await commentService.createComment({
        content: data.content,
      });

      toast.success("Comment created successfully.");

      navigate("/comments");

    } catch(error: unknown) {

      console.error(error);

      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error("Failed to create comment.");
      }
    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Add Comment
      </h1>


      <CommentForm
        onSubmit={handleSubmit}
        loading={loading}
        serverErrors={serverErrors}
      />

    </div>

  );
}
