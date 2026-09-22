import { z } from "zod";

export const createPaymentAllocationSchema = z.object({
  paymentId: z.string().min(1, "Payment is required"),
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type CreatePaymentAllocationFormData = z.infer<typeof createPaymentAllocationSchema>;
