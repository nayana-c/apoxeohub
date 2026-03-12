/**
 * Typed wrappers for /holidays endpoints.
 * Read access: all authenticated users.
 * Write access: hr / admin only.
 */
import { apiFetch } from './api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type HolidayType = 'public' | 'company' | 'optional';

export interface ApiHoliday {
  _id: string;
  name: string;
  date: string;          // ISO string
  type: HolidayType;
  country: string;       // default 'IN'
  location: string;      // default 'all'
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkCreateResult {
  inserted: number;
  skipped: number;
}

// ── List holidays ─────────────────────────────────────────────────────────────
export interface ListHolidaysParams {
  year?: number;
  location?: string;
  type?: HolidayType;
}

export async function listHolidaysApi(params: ListHolidaysParams = {}): Promise<ApiHoliday[]> {
  const qs = new URLSearchParams();
  if (params.year)     qs.set('year', String(params.year));
  if (params.location) qs.set('location', params.location);
  if (params.type)     qs.set('type', params.type);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiFetch<ApiResponse<ApiHoliday[]>>(`/holidays${query}`);
  return res.data;
}

// ── Create holiday (hr / admin) ───────────────────────────────────────────────
export interface HolidayPayload {
  name: string;
  date: string;      // 'YYYY-MM-DD'
  type: HolidayType;
  country?: string;
  location?: string;
}

export async function createHolidayApi(payload: HolidayPayload): Promise<ApiHoliday> {
  const res = await apiFetch<ApiResponse<ApiHoliday>>('/holidays', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Bulk create holidays (hr / admin) — max 50 per call ───────────────────────
export async function bulkCreateHolidaysApi(
  holidays: HolidayPayload[]
): Promise<BulkCreateResult> {
  const res = await apiFetch<ApiResponse<BulkCreateResult>>('/holidays/bulk', {
    method: 'POST',
    body: { holidays },
  });
  return res.data;
}

// ── Update holiday (hr / admin) ───────────────────────────────────────────────
export async function updateHolidayApi(
  id: string,
  payload: Partial<HolidayPayload>
): Promise<ApiHoliday> {
  const res = await apiFetch<ApiResponse<ApiHoliday>>(`/holidays/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

// ── Delete holiday (hr / admin) ───────────────────────────────────────────────
export async function deleteHolidayApi(id: string): Promise<void> {
  await apiFetch<ApiResponse<null>>(`/holidays/${id}`, { method: 'DELETE' });
}
