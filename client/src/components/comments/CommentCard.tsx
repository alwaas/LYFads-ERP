import type { Comment } from "../../types/comment";

interface Props {
  comment: Comment;
}

export default function CommentCard({ comment }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">
          {comment.user?.fullName ?? "Unknown User"}
        </h3>

        <span className="text-sm text-gray-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mt-3 text-gray-700">
        {comment.message}
      </p>
    </div>
  );
}