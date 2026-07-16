import { z } from "zod";

export const createTaskSchema = z.strictObject({
  threadId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  dueAt: z.string().datetime().nullable().optional(),
});
export const updateTaskSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(["open", "in_progress", "completed"]).optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    dueAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
