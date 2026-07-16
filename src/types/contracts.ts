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
export type TaskPriority = PriorityLevel;
export type TaskSource =
  "manual" | "email_action" | "email_deadline" | "email_meeting";

export interface Deadline {
  label: string;
  dateTime: string | null;
  dateText: string | null;
  timezone: string | null;
  confidence: number;
  sourceMessageId: string;
  evidence: string;
}
export interface ActionItem {
  title: string;
  description: string | null;
  assignee: "user" | "sender" | "other" | "unclear";
  dueAt: string | null;
  confidence: number;
  sourceMessageId: string;
  evidence: string;
}
export interface Meeting {
  title: string;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  participants: string[];
  confidence: number;
  sourceMessageId: string;
  evidence: string;
}
export interface AnalysisEvidence {
  claim: string;
  sourceMessageId: string;
  excerpt: string;
}
export type AnalysisSafetyFlag =
  | "possible_prompt_injection"
  | "sensitive_information"
  | "suspicious_link"
  | "financial_request"
  | "credential_request"
  | "uncertain_date"
  | "other";
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
  evidence: AnalysisEvidence[];
  safetyFlags: AnalysisSafetyFlag[];
}

export interface AnalysisUsage {
  used: number;
  limit: number;
  remaining: number;
}

export interface ThreadAnalysisResult {
  analysisId: string;
  analysis: EmailAnalysis;
  cached: boolean;
  usage: AnalysisUsage;
}
export interface AnalysisResponseMeta extends Record<string, unknown> {
  analysisId: string;
  cached: boolean;
  usage: AnalysisUsage;
  demo?: boolean | undefined;
}
export interface AnalyzedThreadResult extends AnalysisResponseMeta {
  analysis: EmailAnalysis;
}

export type BatchAnalysisStatus = "analyzed" | "cached" | "failed" | "skipped";

export interface BatchAnalysisItemResult {
  threadId: string;
  status: BatchAnalysisStatus;
  errorCode: ErrorCode | null;
}

export interface BatchAnalysisResult {
  requested: number;
  analyzed: number;
  cached: number;
  failed: number;
  skipped: number;
  limitReached: boolean;
  usage: AnalysisUsage;
  results: BatchAnalysisItemResult[];
}

export interface EmailParticipant {
  name: string | null;
  email: string;
}

export interface AttachmentMetadata {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  replyTo: string | null;
  sentAt: string;
  subject: string;
  body: string;
  mimeType: string;
  attachments: AttachmentMetadata[];
  trimmed: boolean;
  containsPotentialPromptInjection: boolean;
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
  labels: string[];
  analysisId: string | null;
  analysis: EmailAnalysis | null;
}
export interface EmailThreadDetail extends EmailThreadListItem {
  messages: EmailMessage[];
  contentHash: string;
  normalizedCharacterCount: number;
  trimmed: boolean;
  containsPotentialPromptInjection: boolean;
}
export interface GmailSyncResult {
  requested: number;
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  nextPageToken: string | null;
  syncedAt: string;
}
export type PriorityEmail = EmailThreadListItem & { analysis: EmailAnalysis };
export interface TaskSourceEmail {
  threadId: string | null;
  analysisId: string | null;
  messageId: string | null;
  evidence: string | null;
  threadSubject: string | null;
}
export interface Task {
  id: string;
  threadId: string | null;
  analysisId: string | null;
  title: string;
  description: string | null;
  source: TaskSource;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  sourceEmail: TaskSourceEmail | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateTaskRequest {
  title: string;
  description?: string | null | undefined;
  priority?: TaskPriority | undefined;
  dueAt?: string | null | undefined;
}
export interface CreateTaskFromAnalysisRequest {
  analysisId: string;
  actionIndex: number;
}
export interface UpdateTaskRequest {
  title?: string | undefined;
  description?: string | null | undefined;
  priority?: TaskPriority | undefined;
  dueAt?: string | null | undefined;
  status?: TaskStatus | undefined;
}
export type TaskSort =
  "due_asc" | "due_desc" | "created_desc" | "created_asc" | "priority_desc";
export interface TaskFilters {
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  source?: TaskSource | undefined;
  dueBefore?: string | undefined;
  dueAfter?: string | undefined;
  threadId?: string | undefined;
  limit: number;
  cursor?: string | undefined;
  sort: TaskSort;
}
export interface TaskPagination {
  nextCursor: string | null;
  limit: number;
  total: number;
}
export interface TaskListResponse {
  tasks: Task[];
}
export interface CreateTaskResult {
  task: Task;
  created: boolean;
  duplicate: boolean;
}
export type ReplyTone = "direct" | "balanced" | "warm" | "professional";
export type ReplyLength = "short" | "medium" | "detailed";
export interface ReplyEvidence {
  claim: string;
  sourceMessageId: string;
  excerpt: string;
}
export interface ReplyDraft {
  id: string;
  threadId: string;
  analysisId: string | null;
  tone: ReplyTone;
  length: ReplyLength;
  subject: string;
  body: string;
  confidence: number;
  usedFacts: string[];
  uncertainPoints: string[];
  warnings: string[];
  evidence: ReplyEvidence[];
  createdAt: string;
  updatedAt: string;
  copyOnly: true;
  sent: false;
  isDraftOnly: true;
}
export interface CreateReplyDraftRequest {
  threadId: string;
  tone: ReplyTone;
  length: ReplyLength;
  instructions?: string | undefined;
  force?: boolean | undefined;
}
export type ReplySort = "created_desc" | "created_asc" | "updated_desc";
export interface ReplyDraftFilters {
  threadId?: string | undefined;
  tone?: ReplyTone | undefined;
  length?: ReplyLength | undefined;
  limit: number;
  cursor?: string | undefined;
  sort: ReplySort;
}
export interface ReplyDraftListResponse {
  drafts: ReplyDraft[];
}
export interface ReplyPagination {
  nextCursor: string | null;
  limit: number;
  total: number;
}
export interface ReplyUsage {
  used: number;
  limit: number;
  remaining: number;
}
export interface ReplyGenerationMeta extends Record<string, unknown> {
  cached: boolean;
  usage: ReplyUsage;
  demo?: boolean | undefined;
  copyOnly: true;
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
export type InboxHealthLabel =
  "excellent" | "good" | "attention" | "overloaded" | "insufficient_data";
export interface DashboardHealthFactor {
  key: string;
  label: string;
  value: number;
  impact: "positive" | "neutral" | "negative";
}
export interface DashboardFocusItem {
  id: string;
  type: "task" | "deadline" | "meeting" | "thread" | "draft";
  title: string;
  at: string | null;
  urgency: number;
  threadId: string | null;
  taskId: string | null;
  draftId: string | null;
}
export interface DashboardPriorityThread {
  threadId: string;
  subject: string;
  sender: string | null;
  snippet: string;
  priority: PriorityLevel;
  score: number;
  needsReply: boolean;
  latestMessageAt: string;
  nearestDeadline: string | null;
}
export interface DashboardTaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
}
export interface DashboardRecentDraft {
  id: string;
  threadId: string;
  subject: string;
  tone: ReplyTone;
  length: ReplyLength;
  createdAt: string;
  warningCount: number;
  confidence: number;
  copyOnly: true;
  sent: false;
}
export interface DashboardDistributionItem {
  key: string;
  count: number;
  percentage: number;
}
export interface DashboardTrendPoint {
  date: string;
  count: number;
}
export interface DashboardActivityItem {
  id: string;
  type:
    | "gmail_sync"
    | "analysis"
    | "task_created"
    | "task_completed"
    | "reply_draft";
  title: string;
  at: string;
}
export interface DashboardData {
  generatedAt: string;
  timezone: string;
  demoMode: boolean;
  gmail: {
    connected: boolean;
    gmailAddress: string | null;
    lastSyncedAt: string | null;
    requiresReauthorization: boolean;
    readOnly: true;
  };
  overview: {
    threads: number;
    analyzedThreads: number;
    criticalThreads: number;
    highPriorityThreads: number;
    needsReply: number;
    openTasks: number;
    completedTasks: number;
    overdueTasks: number;
    drafts: number;
    deadlines: number;
    meetings: number;
  };
  inboxHealth: {
    score: number;
    label: InboxHealthLabel;
    factors: DashboardHealthFactor[];
  };
  today: { date: string; items: DashboardFocusItem[] };
  priorityThreads: DashboardPriorityThread[];
  tasks: {
    open: number;
    completed: number;
    overdue: number;
    dueToday: number;
    upcoming: DashboardTaskItem[];
    recentCompletions: DashboardTaskItem[];
  };
  replies: {
    totalDrafts: number;
    recentDrafts: DashboardRecentDraft[];
    pendingReplyThreads: number;
  };
  usage: { analysis: AnalysisUsage; replies: ReplyUsage };
  analytics: {
    categoryDistribution: DashboardDistributionItem[];
    priorityDistribution: DashboardDistributionItem[];
    weeklyThreads: DashboardTrendPoint[];
    weeklyTasksCompleted: DashboardTrendPoint[];
    weeklyDraftsCreated: DashboardTrendPoint[];
    averageConfidence: number;
    estimatedTimeSavedMinutes: number;
  };
  recentActivity: DashboardActivityItem[];
}
export interface GmailConnectionStatus {
  connected: boolean;
  gmailAddress: string | null;
  grantedScopes: string[];
  connectedAt: string | null;
  lastSyncedAt: string | null;
  requiresReauthorization: boolean;
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
  | "OAUTH_STATE_INVALID"
  | "OAUTH_STATE_EXPIRED"
  | "OAUTH_ACCESS_DENIED"
  | "GOOGLE_CONFIGURATION_ERROR"
  | "GMAIL_NOT_CONNECTED"
  | "GMAIL_AUTH_EXPIRED"
  | "GMAIL_PERMISSION_DENIED"
  | "GMAIL_RATE_LIMITED"
  | "GMAIL_SYNC_FAILED"
  | "THREAD_NOT_FOUND"
  | "ANALYSIS_NOT_FOUND"
  | "ACTION_ITEM_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "ANALYSIS_LIMIT_REACHED"
  | "ANALYSIS_FAILED"
  | "MODEL_OUTPUT_INVALID"
  | "THREAD_CONTENT_UNAVAILABLE"
  | "REPLY_DRAFT_NOT_FOUND"
  | "REPLY_LIMIT_REACHED"
  | "OPENAI_NOT_CONFIGURED"
  | "REPLY_GENERATION_FAILED"
  | "MODEL_TIMEOUT"
  | "GROUNDING_FAILED"
  | "RATE_LIMITED"
  | "DEMO_MODE_ONLY"
  | "INTERNAL_ERROR";
export interface ApiError {
  success: false;
  error: { code: ErrorCode; message: string; requestId: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
