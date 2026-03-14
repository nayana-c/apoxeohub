/**
 * Typed wrappers for /reports endpoints.
 */
import { apiFetch, getAccessToken } from './api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Shared param types ────────────────────────────────────────────────────────
export interface ReportParams {
  from?: string;
  to?: string;
  departmentId?: string;
  status?: string;
  year?: number;
}

function buildQs(params: ReportParams): string {
  const qs = new URLSearchParams();
  if (params.from)                              qs.set('from', params.from);
  if (params.to)                                qs.set('to', params.to);
  if (params.departmentId)                      qs.set('departmentId', params.departmentId);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.year)                              qs.set('year', String(params.year));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// ── Response types ────────────────────────────────────────────────────────────
export interface SummaryStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  cancelled: number;
  totalApprovedDays: number;
}

export interface LeaveByType {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  count: number;
  totalDays: number;
}

export interface LeaveByDepartment {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  count: number;
  totalDays: number;
}

export interface MonthlyTrend {
  month: number; // 1–12
  count: number;
  totalDays: number;
}

export interface EmployeeUsage {
  employeeId: string;
  employeeName: string;
  email: string;
  department: string;
  leaveType: string;
  count: number;
  totalDays: number;
}

// ── API functions ─────────────────────────────────────────────────────────────
export async function getSummaryStatsApi(params: ReportParams = {}) {
  const res = await apiFetch<ApiResponse<SummaryStats>>(`/reports/summary${buildQs(params)}`);
  return res.data;
}

export async function getLeavesByTypeApi(params: ReportParams = {}) {
  const res = await apiFetch<ApiResponse<LeaveByType[]>>(`/reports/by-type${buildQs(params)}`);
  return res.data;
}

export async function getLeavesByDepartmentApi(params: ReportParams = {}) {
  const res = await apiFetch<ApiResponse<LeaveByDepartment[]>>(`/reports/by-department${buildQs(params)}`);
  return res.data;
}

export async function getMonthlyTrendApi(params: Pick<ReportParams, 'departmentId' | 'year'> = {}) {
  const res = await apiFetch<ApiResponse<MonthlyTrend[]>>(`/reports/monthly-trend${buildQs(params)}`);
  return res.data;
}

export async function getEmployeeUsageApi(params: ReportParams = {}) {
  const res = await apiFetch<ApiResponse<EmployeeUsage[]>>(`/reports/employee-usage${buildQs(params)}`);
  return res.data;
}

// ── CSV export (raw fetch — returns blob for download) ────────────────────────
export async function exportCsvApi(params: ReportParams = {}): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}/reports/export/csv${buildQs(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}
