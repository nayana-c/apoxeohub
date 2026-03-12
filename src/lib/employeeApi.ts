/**
 * Typed wrappers for /employees endpoints.
 */
import { apiFetch, apiUpload } from './api';
import type { ApiEmployee } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginationMeta {
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

// ── List employees (paginated) ────────────────────────────────────────────────
export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listEmployeesApi(params: ListEmployeesParams = {}) {
  const qs = new URLSearchParams();
  if (params.page)      qs.set('page', String(params.page));
  if (params.limit)     qs.set('limit', String(params.limit));
  if (params.search)    qs.set('search', params.search);
  if (params.role && params.role !== 'all')     qs.set('role', params.role);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.sortBy)    qs.set('sortBy', params.sortBy);
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder);

  const query = qs.toString();
  const res = await apiFetch<PaginatedResponse<ApiEmployee>>(
    `/employees${query ? `?${query}` : ''}`
  );
  return res;
}

// ── Create employee (HR / Admin only) ────────────────────────────────────────
export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  joinDate?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export async function createEmployeeApi(payload: CreateEmployeePayload) {
  const res = await apiFetch<ApiResponse<ApiEmployee>>('/employees', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Get single employee ───────────────────────────────────────────────────────
export async function getEmployeeApi(id: string) {
  const res = await apiFetch<ApiResponse<ApiEmployee>>(`/employees/${id}`);
  return res.data;
}

// ── Update employee (HR / Admin only) ────────────────────────────────────────
export interface UpdateEmployeePayload {
  name?: string;
  role?: 'employee' | 'manager' | 'hr' | 'admin';
  department?: string | null;
  managerId?: string | null;
  joinDate?: string;
  status?: 'active' | 'inactive';
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
}

export async function updateEmployeeApi(id: string, payload: UpdateEmployeePayload) {
  const res = await apiFetch<ApiResponse<ApiEmployee>>(`/employees/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

// ── Upload employee avatar (HR / Admin only) ──────────────────────────────────
export async function uploadEmployeeAvatarApi(id: string, file: File) {
  const form = new FormData();
  form.append('avatar', file);
  const res = await apiUpload<ApiResponse<ApiEmployee>>(`/employees/${id}/avatar`, form);
  return res.data;
}

// ── Deactivate employee (HR / Admin only) ─────────────────────────────────────
export async function deactivateEmployeeApi(id: string) {
  const res = await apiFetch<ApiResponse<ApiEmployee>>(`/employees/${id}/deactivate`, {
    method: 'PATCH',
  });
  return res.data;
}

// ── Activate employee (HR / Admin only) ───────────────────────────────────────
export async function activateEmployeeApi(id: string) {
  const res = await apiFetch<ApiResponse<ApiEmployee>>(`/employees/${id}/activate`, {
    method: 'PATCH',
  });
  return res.data;
}
