export type EmailCategory =
  | "urgent"
  | "work"
  | "finance"
  | "meeting"
  | "personal"
  | "newsletter"
  | "promotion"
  | "notification"
  | "security"
  | "other";
export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type TaskStatus = "open" | "in_progress" | "completed";

export interface Deadline {
  id: string;
  label: string;
  dueAt: string | null;
  evidence: string;
  confidence: number;
}
export interface ActionItem {
  id: string;
  title: string;
  owner: string | null;
  dueAt: string | null;
  evidence: string;
}
export interface Meeting {
  id: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  evidence: string;
}
export interface EmailAnalysis {
  summary: string;
  category: EmailCategory;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  priorityReason: string;
  needsReply: boolean;
  replyReason: string | null;
  confidence: number;
  deadlines: Deadline[];
  actionItems: ActionItem[];
  meetings: Meeting[];
  evidence: string[];
  safetyFlags: string[];
}
export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  sentAt: string;
  body: string;
}
export interface EmailThreadListItem {
  id: string;
  subject: string;
  participants: string[];
  senderNames: string[];
  snippet: string;
  latestMessageAt: string;
  messageCount: number;
  hasAttachments: boolean;
  analysis: EmailAnalysis | null;
}
export interface EmailThreadDetail extends EmailThreadListItem {
  messages: EmailMessage[];
}
export type PriorityEmail = EmailThreadListItem & { analysis: EmailAnalysis };
export interface Task {
  id: string;
  threadId: string | null;
  title: string;
  description: string | null;
  source: "email" | "manual";
  status: TaskStatus;
  priority: PriorityLevel;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
}
export interface ReplyDraft {
  id: string;
  threadId: string;
  tone: "direct" | "balanced" | "warm" | "professional";
  length: "short" | "medium" | "detailed";
  subject: string;
  body: string;
  confidence: number;
  uncertainPoints: string[];
  warnings: string[];
  isDraftOnly: true;
}
export interface InboxInsight {
  label: string;
  value: number;
  unit: "count" | "percent";
  trend: "up" | "down" | "flat";
}
export interface DashboardSummary {
  totalThreads: number;
  needsReply: number;
  urgent: number;
  openTasks: number;
  priorityEmails: PriorityEmail[];
  insights: InboxInsight[];
}
export interface GmailConnectionStatus {
  connected: boolean;
  address: string | null;
  lastSyncedAt: string | null;
  scopes: string[];
  readOnly: true;
}
export interface UserSettings {
  demoMode: boolean;
  dailyAnalysisLimit: number;
  gmailLookbackDays: number;
  gmailMaxThreads: number;
  dataRetentionHours: number;
  preferredTone: ReplyDraft["tone"];
  preferredReplyLength: ReplyDraft["length"];
}
export interface ApiSuccess<
  T,
  M extends Record<string, unknown> = Record<string, unknown>,
> {
  success: true;
  data: T;
  meta: M;
}
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "GMAIL_NOT_CONNECTED"
  | "GMAIL_AUTH_EXPIRED"
  | "GMAIL_PERMISSION_DENIED"
  | "THREAD_NOT_FOUND"
  | "ANALYSIS_LIMIT_REACHED"
  | "ANALYSIS_FAILED"
  | "MODEL_OUTPUT_INVALID"
  | "RATE_LIMITED"
  | "DEMO_MODE_ONLY"
  | "INTERNAL_ERROR";
export interface ApiError {
  success: false;
  error: { code: ErrorCode; message: string; requestId: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
