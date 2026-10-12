import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, mapUnknownError } from "@/lib/errors";
import type { ApiError, ApiSuccess } from "@/types/contracts";

export function ok<T>(
  data: T,
  meta: Record<string, unknown> = {},
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, meta }, { status });
}
export function failure(
  error: unknown,
  requestId = randomUUID(),
): NextResponse<ApiError> {
  const mapped =
    error instanceof ZodError
      ? new AppError("INVALID_REQUEST", "The request data is invalid.", 400)
      : mapUnknownError(error);
  return NextResponse.json(
    {
      success: false,
      error: { code: mapped.code, message: mapped.message, requestId },
    },
    { status: mapped.status },
  );
}
