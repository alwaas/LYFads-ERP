export function mapServerValidationErrors(
  error: unknown,
): Record<string, string> | null {
  if (!error || typeof error !== "object") return null;

  const axiosError = error as {
    response?: { data?: { message?: unknown } };
  };

  const message = axiosError.response?.data?.message;

  if (!Array.isArray(message)) return null;

  const fieldErrors: Record<string, string> = {};

  for (const err of message) {
    if (err && typeof err === "object" && "property" in err) {
      const property = (err as { property: string }).property;
      const constraints = (err as { constraints?: Record<string, string> })
        .constraints;

      if (property && constraints && typeof constraints === "object") {
        const firstMessage = Object.values(constraints)[0];
        if (typeof firstMessage === "string") {
          fieldErrors[property] = firstMessage;
        }
      }
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}
