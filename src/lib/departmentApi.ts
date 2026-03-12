/**
 * Typed wrappers for /departments endpoints.
 */
import { apiFetch } from './api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiDepartment {
  _id: string;
  name: string;
  code: string;
  headId?: { _id: string; name: string; email: string; employeeId: string } | null;
  parentId?: { _id: string; name: string; code: string } | null;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── List all departments ──────────────────────────────────────────────────────
export async function listDepartmentsApi(includeInactive = false): Promise<ApiDepartment[]> {
  const qs = includeInactive ? '?includeInactive=true' : '';
  const res = await apiFetch<ApiResponse<ApiDepartment[]>>(`/departments${qs}`);
  return res.data;
}

// ── Create department (HR / Admin only) ───────────────────────────────────────
export interface CreateDepartmentPayload {
  name: string;
  code: string;
  headId?: string | null;
  parentId?: string | null;
  location?: string;
}

export async function createDepartmentApi(payload: CreateDepartmentPayload) {
  const res = await apiFetch<ApiResponse<ApiDepartment>>('/departments', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Update department (HR / Admin only) ───────────────────────────────────────
export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  headId?: string | null;
  parentId?: string | null;
  location?: string;
  isActive?: boolean;
}

export async function updateDepartmentApi(id: string, payload: UpdateDepartmentPayload) {
  const res = await apiFetch<ApiResponse<ApiDepartment>>(`/departments/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}
