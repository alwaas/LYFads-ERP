import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment is required")
    .max(2000, "Comment must not exceed 2000 characters")
    .trim(),
});

export const editCommentSchema = createCommentSchema.partial().extend({
  content: z
    .string()
    .min(1, "Comment is required")
    .max(2000, "Comment must not exceed 2000 characters")
    .trim()
    .optional(),
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
export type EditCommentFormData = z.infer<typeof editCommentSchema>;
