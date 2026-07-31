import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageContainer from "../../components/layout/PageContainer";
import CommentForm from "../../components/comments/CommentForm";
import { commentService } from "../../services/comment.service";

function EditCommentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState({
    content: "",
  });

  useEffect(() => {
    const fetchComment = async () => {
      try {
        if (!id) return;

        const response = await commentService.getComment(id);

        setComment({
          content: response.content,
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

      await commentService.updateComment(id, data);

      toast.success("Comment updated successfully");

      navigate("/comments");

    } catch (error) {
      toast.error("Failed to update comment");
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
        />
      </div>
    </PageContainer>
  );
}

export default EditCommentPage;
