import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createCommentSchema, editCommentSchema, type CreateCommentFormData, type EditCommentFormData } from "../../features/validation/comment.schema";

interface CommentFormData {
  content: string;
}

interface Props {
  initialData?: CommentFormData;
  onSubmit: (data: CommentFormData) => Promise<void>;
  loading?: boolean;
  serverErrors?: Record<string, string>;
}

type FormData = CreateCommentFormData | EditCommentFormData;

export default function CommentForm({
  initialData,
  onSubmit,
  loading = false,
  serverErrors,
}: Props) {
  const schema = initialData ? editCommentSchema : createCommentSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        content: initialData.content || "",
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as unknown as CommentFormData);
  };

  return (

    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-lg shadow p-6 space-y-5"
    >

      <div>

        <label className="block mb-2 font-medium">
          Comment
        </label>


        <textarea
          rows={5}
          {...register("content")}
          className="w-full border rounded-lg p-3"
          placeholder="Write comment..."
        />
        {errors.content && (
          <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
        )}

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
