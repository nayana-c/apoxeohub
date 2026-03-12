/**
 * Typed wrappers for every /auth endpoint.
 */
import { apiFetch, apiUpload, getAccessToken, ApiError } from './api';
import type { AuthUser } from '@/types/auth';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Login ────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  mustResetPassword: boolean;
}

export async function loginApi(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.message ?? 'Login failed', res.status);
  return (json as ApiResponse<LoginResponse>).data;
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutApi() {
  const token = getAccessToken();
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── Get current user ─────────────────────────────────────────────────────────
export async function getMeApi() {
  const res = await apiFetch<ApiResponse<AuthUser>>('/auth/me');
  return res.data;
}

// ── Update own profile (name, phone, address, dateOfBirth) ───────────────────
export interface UpdateMePayload {
  name?: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
}

export async function updateMeApi(payload: UpdateMePayload) {
  const res = await apiFetch<ApiResponse<AuthUser>>('/auth/me', {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

// ── Upload own profile picture ────────────────────────────────────────────────
export async function uploadMyAvatarApi(file: File) {
  const form = new FormData();
  form.append('avatar', file);
  const res = await apiUpload<ApiResponse<AuthUser>>('/auth/me/avatar', form);
  return res.data;
}

// ── Refresh token (called by api.ts internally, but exposed for manual use) ──
export async function refreshApi() {
  const res = await apiFetch<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  });
  return res.data;
}

// ── Forgot password ──────────────────────────────────────────────────────────
export async function forgotPasswordApi(email: string) {
  await apiFetch('/auth/forgot-password', {
    method: 'POST',
    skipAuth: true,
    body: { email },
  });
}

// ── Reset password (from email link) ─────────────────────────────────────────
export async function resetPasswordApi(token: string, password: string) {
  await apiFetch('/auth/reset-password', {
    method: 'POST',
    skipAuth: true,
    body: { token, password },
  });
}

// ── Change password (authenticated, first-login or profile settings) ─────────
export async function changePasswordApi(currentPassword: string, newPassword: string) {
  await apiFetch('/auth/change-password', {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  });
}
