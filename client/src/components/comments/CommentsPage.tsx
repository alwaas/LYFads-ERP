import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import CommentList from "./CommentList";
import Pagination from "../../components/ui/Pagination";

import { commentService } from "../../services/comment.service";

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result: any = await commentService.getComments(page, limit);
      setComments(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [page, limit]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comments</h1>
        <Link
          to="/comments/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
        >
          + Add Comment
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No comments found.</p>
        </div>
      ) : (
        <>
          <CommentList comments={comments} />
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
        </>
      )}
    </div>
  );
}
