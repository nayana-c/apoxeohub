/**
 * Typed wrappers for /leaves and /balances endpoints.
 */
import { apiFetch, getAccessToken, ApiError } from './api';
import type { LeaveStatus } from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ── Shared shape ──────────────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// The BE paginated() helper sends data + meta as sibling fields (flat), not nested.
interface FlatPaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginatedResponse<T>['meta'];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── Leave request types ───────────────────────────────────────────────────────
export interface ApiLeaveType {
  _id: string;
  name: string;
  code: string;
}

export interface ApiApproval {
  approverId: { _id: string; name: string; employeeId: string } | null;
  action: 'approved' | 'rejected';
  comment?: string;
  timestamp: string;
}

export interface ApiComment {
  userId: { _id: string; name: string; employeeId: string } | null;
  text: string;
  createdAt: string;
}

export interface ApiLeaveRequest {
  _id: string;
  employeeId: { _id: string; name: string; employeeId: string; email: string } | string;
  leaveTypeId: ApiLeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  status: LeaveStatus;
  appliedOn: string;
  approvals: ApiApproval[];
  currentLevel: number;
  comments: ApiComment[];
  createdAt: string;
  updatedAt: string;
}

// ── Balance types ─────────────────────────────────────────────────────────────

/** Shape returned by GET /balances/me (used in apply-leave page) */
export interface ApiLeaveBalance {
  _id: string;
  leaveTypeId: { _id: string; name: string; code: string };
  year: number;
  allocated: number;
  used: number;
  carried: number;
  adjusted: number;
  remaining: number;
}

/**
 * Shape returned by GET /balances/:userId (hr/admin).
 * The service uses `leaveType` (populated) instead of `leaveTypeId`.
 */
export interface ApiBalanceRecord {
  _id: string;
  leaveType: {
    _id: string;
    name: string;
    code: string;
    accrualType: string;
    defaultDays: number;
  };
  year: number;
  allocated: number;
  used: number;
  carried: number;
  adjusted: number;
  remaining: number;
}

// ── List query params ─────────────────────────────────────────────────────────
export interface ListLeavesParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── List my leaves ────────────────────────────────────────────────────────────
export async function listMyLeavesApi(
  params: ListLeavesParams = {}
): Promise<PaginatedResponse<ApiLeaveRequest>> {
  const qs = new URLSearchParams();
  if (params.page)        qs.set('page',        String(params.page));
  if (params.limit)       qs.set('limit',       String(params.limit));
  if (params.status)      qs.set('status',      params.status);
  if (params.leaveTypeId) qs.set('leaveTypeId', params.leaveTypeId);
  if (params.startDate)   qs.set('startDate',   params.startDate);
  if (params.endDate)     qs.set('endDate',     params.endDate);
  if (params.sortBy)      qs.set('sortBy',      params.sortBy);
  if (params.sortOrder)   qs.set('sortOrder',   params.sortOrder);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiFetch<FlatPaginatedApiResponse<ApiLeaveRequest>>(`/leaves${query}`);
  return { data: Array.isArray(res.data) ? res.data : [], meta: res.meta };
}

// ── Get single leave ──────────────────────────────────────────────────────────
export async function getLeaveApi(id: string): Promise<ApiLeaveRequest> {
  const res = await apiFetch<ApiResponse<ApiLeaveRequest>>(`/leaves/${id}`);
  return res.data;
}

// ── Submit leave (supports optional file attachment) ─────────────────────────
// Sends multipart/form-data when a file is provided, plain JSON otherwise.
export async function submitLeaveApi(
  payload: { leaveTypeId: string; startDate: string; endDate: string; reason: string },
  file?: File | null
): Promise<ApiLeaveRequest> {
  if (file) {
    // Multipart upload — must bypass apiFetch which hard-codes JSON
    const form = new FormData();
    form.append('leaveTypeId', payload.leaveTypeId);
    form.append('startDate',   payload.startDate);
    form.append('endDate',     payload.endDate);
    form.append('reason',      payload.reason);
    form.append('attachment',  file);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`${BASE_URL}/leaves`, {
      method: 'POST',
      headers,
      body: form,
      credentials: 'include',
    });

    // Retry once after 401 (token refresh happens automatically in apiFetch,
    // but here we replicate the minimal version)
    if (res.status === 401) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newToken = refreshJson?.data?.accessToken;
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(`${BASE_URL}/leaves`, {
            method: 'POST',
            headers,
            body: form,
            credentials: 'include',
          });
        }
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(
        json?.message ?? `Request failed with status ${res.status}`,
        res.status,
        json?.details
      );
    }
    return (json as ApiResponse<ApiLeaveRequest>).data;
  }

  // No file — plain JSON
  const res = await apiFetch<ApiResponse<ApiLeaveRequest>>('/leaves', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Cancel leave ──────────────────────────────────────────────────────────────
export async function cancelLeaveApi(id: string): Promise<ApiLeaveRequest> {
  const res = await apiFetch<ApiResponse<ApiLeaveRequest>>(`/leaves/${id}/cancel`, {
    method: 'PATCH',
  });
  return res.data;
}

// ── Add comment ───────────────────────────────────────────────────────────────
export async function addCommentApi(id: string, text: string): Promise<ApiLeaveRequest> {
  const res = await apiFetch<ApiResponse<ApiLeaveRequest>>(`/leaves/${id}/comments`, {
    method: 'POST',
    body: { text },
  });
  return res.data;
}

// ── Get my leave balances ─────────────────────────────────────────────────────
export async function getMyBalancesApi(year?: number): Promise<ApiLeaveBalance[]> {
  const qs = year ? `?year=${year}` : '';
  const res = await apiFetch<ApiResponse<ApiLeaveBalance[]>>(`/balances/me${qs}`);
  return res.data;
}

// ── Get a specific employee's balances (hr / admin) ───────────────────────────
export async function getEmployeeBalancesApi(
  userId: string,
  year?: number
): Promise<ApiBalanceRecord[]> {
  const qs = year ? `?year=${year}` : '';
  const res = await apiFetch<ApiResponse<ApiBalanceRecord[]>>(`/balances/${userId}${qs}`);
  return res.data;
}

// ── List team leaves for approval (manager / hr / admin) ─────────────────────
export interface ListApprovalsParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listPendingApprovalsApi(
  params: ListApprovalsParams = {}
): Promise<PaginatedResponse<ApiLeaveRequest>> {
  const qs = new URLSearchParams();
  if (params.page)        qs.set('page',        String(params.page));
  if (params.limit)       qs.set('limit',       String(params.limit));
  if (params.status)      qs.set('status',      params.status);
  if (params.leaveTypeId) qs.set('leaveTypeId', params.leaveTypeId);
  if (params.startDate)   qs.set('startDate',   params.startDate);
  if (params.endDate)     qs.set('endDate',     params.endDate);
  if (params.sortBy)      qs.set('sortBy',      params.sortBy);
  if (params.sortOrder)   qs.set('sortOrder',   params.sortOrder);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiFetch<FlatPaginatedApiResponse<ApiLeaveRequest>>(
    `/leaves/team/all${query}`
  );
  return { data: Array.isArray(res.data) ? res.data : [], meta: res.meta };
}

// ── Approve a leave request (manager / hr / admin) ───────────────────────────
export async function approveLeaveApi(
  id: string,
  comment?: string
): Promise<ApiLeaveRequest> {
  const res = await apiFetch<ApiResponse<ApiLeaveRequest>>(`/leaves/${id}/approve`, {
    method: 'PATCH',
    body: comment ? { comment } : {},
  });
  return res.data;
}

// ── Reject a leave request (manager / hr / admin) ────────────────────────────
export async function rejectLeaveApi(
  id: string,
  comment: string
): Promise<ApiLeaveRequest> {
  const res = await apiFetch<ApiResponse<ApiLeaveRequest>>(`/leaves/${id}/reject`, {
    method: 'PATCH',
    body: { comment },
  });
  return res.data;
}

// ── Adjust a balance (hr / admin) ────────────────────────────────────────────
// `adjustment` is a delta: positive = add days, negative = remove days.
// It accumulates in the `adjusted` field on the balance record.
export async function adjustBalanceApi(
  userId: string,
  leaveTypeId: string,
  adjustment: number,
  reason: string
): Promise<{ _id: string; adjusted: number; remaining: number }> {
  const res = await apiFetch<ApiResponse<{ _id: string; adjusted: number; remaining: number }>>(
    `/balances/${userId}/adjust`,
    {
      method: 'PATCH',
      body: { leaveTypeId, adjustment, reason },
    }
  );
  return res.data;
}
