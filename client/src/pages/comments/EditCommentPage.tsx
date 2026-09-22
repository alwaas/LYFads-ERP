import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageContainer from "../../components/layout/PageContainer";
import CommentForm from "../../components/comments/CommentForm";
import { commentService } from "../../services/comment.service";

import { mapServerValidationErrors } from "../../features/validation/errors";

function EditCommentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState({
    content: "",
  });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchComment = async () => {
      try {
        if (!id) return;

        const response = await commentService.getComment(id);

        setComment({
          content: response.message || response.content || "",
        });

      } catch (error) {
        toast.error("Failed to load comment");
        navigate("/comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComment();
  }, [id, navigate]);


  const handleSubmit = async (data: { content: string }) => {
    try {
      if (!id) return;

      setServerErrors({});
      await commentService.updateComment(id, {
        content: data.content,
      });

      toast.success("Comment updated successfully");

      navigate("/comments");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error("Failed to update comment");
      }
    }
  };


  if (loading) {
    return (
      <PageContainer>
        <p>Loading...</p>
      </PageContainer>
    );
  }


  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">
          Edit Comment
        </h1>

        <CommentForm
          initialData={comment}
          onSubmit={handleSubmit}
          serverErrors={serverErrors}
        />
      </div>
    </PageContainer>
  );
}

export default EditCommentPage;
