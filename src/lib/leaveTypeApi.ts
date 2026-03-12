/**
 * Typed wrappers for /leave-types endpoints.
 * Note: create/update/activate/deactivate require the 'admin' role.
 */
import { apiFetch } from './api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type AccrualType = 'annual' | 'monthly' | 'none';

export interface ApiLeaveType {
  _id: string;
  name: string;
  code: string;
  description: string;
  defaultDays: number;
  carryForwardMax: number;
  accrualType: AccrualType;
  requiresDoc: boolean;
  minNoticeDays: number;
  maxConsecutive: number;
  isActive: boolean;
  applicableTo: { _id: string; name: string; code: string }[];
  createdAt: string;
  updatedAt: string;
}

// ── List leave types ──────────────────────────────────────────────────────────
// Pass all=true to include inactive (hr/admin only on backend)
export async function listLeaveTypesApi(all = false): Promise<ApiLeaveType[]> {
  const qs = all ? '?all=true' : '';
  const res = await apiFetch<ApiResponse<ApiLeaveType[]>>(`/leave-types${qs}`);
  return res.data;
}

// ── Create leave type (admin only) ────────────────────────────────────────────
export interface LeaveTypePayload {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  carryForwardMax?: number;
  accrualType?: AccrualType;
  requiresDoc?: boolean;
  minNoticeDays?: number;
  maxConsecutive?: number;
  applicableTo?: string[];
}

export async function createLeaveTypeApi(payload: LeaveTypePayload): Promise<ApiLeaveType> {
  const res = await apiFetch<ApiResponse<ApiLeaveType>>('/leave-types', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Update leave type — uses PUT (admin only) ─────────────────────────────────
export async function updateLeaveTypeApi(
  id: string,
  payload: Partial<LeaveTypePayload>
): Promise<ApiLeaveType> {
  const res = await apiFetch<ApiResponse<ApiLeaveType>>(`/leave-types/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return res.data;
}

// ── Deactivate leave type (admin only) ────────────────────────────────────────
export async function deactivateLeaveTypeApi(id: string): Promise<ApiLeaveType> {
  const res = await apiFetch<ApiResponse<ApiLeaveType>>(`/leave-types/${id}/deactivate`, {
    method: 'PATCH',
  });
  return res.data;
}

// ── Activate leave type (admin only) ─────────────────────────────────────────
export async function activateLeaveTypeApi(id: string): Promise<ApiLeaveType> {
  const res = await apiFetch<ApiResponse<ApiLeaveType>>(`/leave-types/${id}/activate`, {
    method: 'PATCH',
  });
  return res.data;
}
