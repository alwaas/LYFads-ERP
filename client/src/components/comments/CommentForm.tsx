import { useState } from "react";

interface CommentFormData {
  content: string;
}

interface Props {
  initialData?: CommentFormData;
  onSubmit: (
    data: CommentFormData
  ) => Promise<void>;
  loading?: boolean;
}

export default function CommentForm({
  initialData,
  onSubmit,
  loading = false,
}: Props) {

  const [content, setContent] = useState(
    initialData?.content ?? ""
  );


  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();


    if (!content.trim()) {
      alert("Comment is required");
      return;
    }


    await onSubmit({
      content,
    });

  };


  return (

    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6 space-y-5"
    >

      <div>

        <label className="block mb-2 font-medium">
          Comment
        </label>


        <textarea
          rows={5}
          value={content}
          onChange={(e)=>
            setContent(e.target.value)
          }
          className="w-full border rounded-lg p-3"
          placeholder="Write comment..."
        />

      </div>


      <button
        disabled={loading}
        className="
        bg-blue-600 
        text-white 
        px-5 
        py-2 
        rounded-lg
        disabled:opacity-50
        "
      >

        {
          loading 
          ? "Saving..."
          : "Save Comment"
        }

      </button>


    </form>

  );
}