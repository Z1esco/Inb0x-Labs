import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });
const taskPrioritySchema = z.enum(["critical", "high", "medium", "low"]);
const taskStatusSchema = z.enum(["open", "in_progress", "completed"]);
const taskSourceSchema = z.enum([
  "manual",
  "email_action",
  "email_deadline",
  "email_meeting",
]);

export const createTaskSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: taskPrioritySchema.default("medium"),
  dueAt: isoDateTime.nullable().optional(),
});

export const createTaskFromAnalysisSchema = z.strictObject({
  analysisId: z.string().uuid(),
  actionIndex: z.number().int().min(0).max(14),
});

export const updateTaskSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueAt: isoDateTime.nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const taskListQuerySchema = z
  .strictObject({
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    source: taskSourceSchema.optional(),
    dueBefore: isoDateTime.optional(),
    dueAfter: isoDateTime.optional(),
    threadId: z.string().trim().min(1).max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().min(1).max(1000).optional(),
    sort: z
      .enum([
        "due_asc",
        "due_desc",
        "created_desc",
        "created_asc",
        "priority_desc",
      ])
      .default("created_desc"),
  })
  .refine(
    (value) =>
      !value.dueBefore ||
      !value.dueAfter ||
      new Date(value.dueAfter) <= new Date(value.dueBefore),
    { message: "dueAfter must not be later than dueBefore" },
  );

export const taskIdSchema = z.string().trim().min(1).max(200);
