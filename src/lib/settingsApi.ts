import { apiFetch } from './api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Shape returned by the API ─────────────────────────────────────────────────
export interface AppSettings {
  _id: string;
  key: string;

  // Organization
  orgName: string;
  orgTimezone: string;
  /** 1 = January … 12 = December */
  fiscalYearStart: number;
  /** Weekday indices that are working days (0 = Sunday … 6 = Saturday) */
  workingDays: number[];
  workingHoursPerDay: number;

  // Approval Workflow
  multiLevelApproval: boolean;
  autoApproveSickLeave: boolean;
  approvalSlaHours: number;

  // Notifications
  notifyOnLeaveApplied: boolean;
  notifyOnDecision: boolean;
  notifyOnBalanceExpiry: boolean;

  // Leave Policy
  carryForwardCap: number;
  minNoticeDays: number;
  probationLeaveRestriction: boolean;

  updatedAt: string;
}

export async function getSettingsApi(): Promise<AppSettings> {
  const res = await apiFetch<ApiResponse<AppSettings>>('/settings');
  return res.data;
}

export async function updateSettingsApi(data: Partial<AppSettings>): Promise<AppSettings> {
  const res = await apiFetch<ApiResponse<AppSettings>>('/settings', {
    method: 'PATCH',
    body: data,
  });
  return res.data;
}
