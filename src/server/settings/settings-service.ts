import { getGmailConnectionStatus } from "@/server/gmail/connection-service";
import { getAnalysisUsage } from "@/server/ai/analysis-service";
import { getReplyUsage } from "@/server/replies/reply-service";
import type { CurrentUser } from "@/server/auth/current-user";
import {
  deleteAuthAccount,
  exportAccountRows,
  loadSettingsRows,
  updateSettingsRows,
} from "@/server/settings/settings-repository";
import {
  getDemoSettings,
  resetDemo,
  updateDemoSettings,
} from "@/server/services/demo-store";
import { demoThreads } from "@/mock/emails";
import type {
  AccountData,
  SettingsData,
  UpdateSettingsRequest,
} from "@/types/contracts";

function mapSettings(
  rows: Awaited<ReturnType<typeof loadSettingsRows>>,
  usage: SettingsData["ai"]["usage"],
  gmail: SettingsData["gmail"],
): SettingsData {
  const value = rows.settings;
  return {
    profile: {
      displayName: rows.profile?.display_name ?? null,
      avatarUrl: rows.profile?.avatar_url ?? null,
      timezone: value.timezone,
      locale: value.locale,
    },
    appearance: value.appearance,
    dashboard: {
      defaultLandingPage: value.default_landing_page,
      compactMode: value.compact_mode,
      showAnalytics: value.show_analytics,
      showInboxHealth: value.show_inbox_health,
      showRecentActivity: value.show_recent_activity,
    },
    ai: {
      defaultReplyTone: value.preferred_tone,
      defaultReplyLength: value.preferred_reply_length,
      dailyAnalysisLimit: value.daily_analysis_limit,
      usage,
      demoMode: false,
    },
    gmail,
  };
}

export async function getSettings(user: CurrentUser): Promise<SettingsData> {
  if (user.demo) {
    const value = getDemoSettings();
    return {
      profile: {
        displayName: value.displayName ?? null,
        avatarUrl: null,
        timezone: value.timezone ?? "UTC",
        locale: value.locale ?? "en",
      },
      appearance: value.appearance ?? "system",
      dashboard: {
        defaultLandingPage: value.defaultLandingPage ?? "dashboard",
        compactMode: value.compactMode ?? false,
        showAnalytics: value.showAnalytics ?? true,
        showInboxHealth: value.showInboxHealth ?? true,
        showRecentActivity: value.showRecentActivity ?? true,
      },
      ai: {
        defaultReplyTone: value.preferredTone,
        defaultReplyLength: value.preferredReplyLength,
        dailyAnalysisLimit: value.dailyAnalysisLimit,
        usage: {
          analysis: { used: 0, limit: 20, remaining: 20 },
          replies: { used: 0, limit: 20, remaining: 20 },
        },
        demoMode: true,
      },
      gmail: {
        connected: true,
        gmailAddress: "judge@inb0x.demo",
        grantedScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
        connectedAt: "2026-07-16T08:00:00.000Z",
        lastSyncedAt: "2026-07-16T08:55:00.000Z",
        requiresReauthorization: false,
        readOnly: true,
      },
    };
  }
  const rows = await loadSettingsRows(user.id);
  const [analysis, replies, gmail] = await Promise.all([
    getAnalysisUsage(user.id, rows.settings.daily_analysis_limit),
    getReplyUsage(user.id),
    getGmailConnectionStatus(user.id),
  ]);
  return mapSettings(rows, { analysis, replies }, gmail);
}

export async function updateSettings(
  user: CurrentUser,
  input: UpdateSettingsRequest,
): Promise<SettingsData> {
  if (user.demo) {
    updateDemoSettings({
      ...(input.defaultReplyTone && { preferredTone: input.defaultReplyTone }),
      ...(input.defaultReplyLength && {
        preferredReplyLength: input.defaultReplyLength,
      }),
      ...(input.timezone && { timezone: input.timezone }),
      ...(input.locale && { locale: input.locale }),
      ...(input.appearance && { appearance: input.appearance }),
      ...(input.defaultLandingPage && {
        defaultLandingPage: input.defaultLandingPage,
      }),
      ...(input.compactMode !== undefined && {
        compactMode: input.compactMode,
      }),
      ...(input.showAnalytics !== undefined && {
        showAnalytics: input.showAnalytics,
      }),
      ...(input.showInboxHealth !== undefined && {
        showInboxHealth: input.showInboxHealth,
      }),
      ...(input.showRecentActivity !== undefined && {
        showRecentActivity: input.showRecentActivity,
      }),
      ...(input.displayName !== undefined && {
        displayName: input.displayName,
      }),
    });
    return getSettings(user);
  }
  await updateSettingsRows(user.id, input);
  return getSettings(user);
}

export async function getAccount(user: CurrentUser): Promise<AccountData> {
  if (user.demo)
    return {
      id: user.id,
      email: user.email,
      createdAt: "2026-07-16T08:00:00.000Z",
      demoMode: true,
      exportData: {
        profile: { displayName: "Demo Judge" },
        settings: getDemoSettings() as unknown as Record<string, unknown>,
        gmail: { gmailAddress: "judge@inb0x.demo", readOnly: true },
        threads: demoThreads as unknown as Record<string, unknown>[],
        analyses: [],
        tasks: [],
        drafts: [],
      },
    };
  const data = await exportAccountRows(user.id);
  return {
    id: user.id,
    email: user.email,
    createdAt:
      typeof data.profile?.created_at === "string"
        ? data.profile.created_at
        : null,
    demoMode: false,
    exportData: data,
  };
}

export async function deleteAccount(
  user: CurrentUser,
): Promise<{ deleted: true }> {
  if (user.demo) {
    resetDemo();
    return { deleted: true };
  }
  await deleteAuthAccount(user.id);
  return { deleted: true };
}
