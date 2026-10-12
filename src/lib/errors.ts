import type { ErrorCode } from "@/types/contracts";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}
export function mapUnknownError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof SyntaxError)
    return new AppError("INVALID_REQUEST", "The request body is invalid.", 400);
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
