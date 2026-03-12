'use client';

import { useState, useEffect, useRef } from 'react';
import {
  updateEmployeeApi,
  uploadEmployeeAvatarApi,
  deactivateEmployeeApi,
  activateEmployeeApi,
  listEmployeesApi,
  type UpdateEmployeePayload,
} from '@/lib/employeeApi';
import { listDepartmentsApi, type ApiDepartment } from '@/lib/departmentApi';
import { ApiError } from '@/lib/api';
import type { ApiEmployee } from '@/types';

interface Props {
  employee: ApiEmployee;
  onClose: () => void;
  onUpdated: (employee: ApiEmployee) => void;
}

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager',  label: 'Manager' },
  { value: 'hr',       label: 'HR' },
  { value: 'admin',    label: 'Admin' },
] as const;

function resolveManagerId(managerId: ApiEmployee['managerId']): string | null {
  if (!managerId) return null;
  if (typeof managerId === 'object' && '_id' in managerId) return managerId._id;
  return managerId as string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7001/api/v1').replace('/api/v1', '');

function toAbsUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export default function EditEmployeeModal({ employee, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<UpdateEmployeePayload>({
    name:        employee.name,
    role:        employee.role,
    department:  employee.department?._id ?? null,
    managerId:   resolveManagerId(employee.managerId),
    joinDate:    employee.joinDate.split('T')[0],
    phone:       employee.phone ?? null,
    address:     employee.address ?? null,
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : null,
  });

  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [managers, setManagers]       = useState<ApiEmployee[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  const [saving, setSaving]               = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(toAbsUrl(employee.profilePicture));

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDropdownsLoading(true);
    Promise.all([
      listDepartmentsApi().catch(() => [] as ApiDepartment[]),
      listEmployeesApi({ limit: 200, status: 'active', sortBy: 'name', sortOrder: 'asc' })
        .then((r) => r.data)
        .catch(() => [] as ApiEmployee[]),
    ]).then(([depts, allEmployees]) => {
      setDepartments(depts);
      setManagers(allEmployees.filter((e) => e._id !== employee._id));
    }).finally(() => setDropdownsLoading(false));
  }, [employee._id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === '' ? null : value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAvatarLoading(true);
    try {
      const updated = await uploadEmployeeAvatarApi(employee._id, file);
      setPreviewUrl(toAbsUrl(updated.profilePicture));
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Avatar upload failed.');
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) { setError('Name is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      const updated = await updateEmployeeApi(employee._id, form);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setError(null);
    setStatusLoading(true);
    try {
      const updated = employee.status === 'active'
        ? await deactivateEmployeeApi(employee._id)
        : await activateEmployeeApi(employee._id);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  }

  const busy = saving || statusLoading || avatarLoading;
  const initials = employee.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div className="modal">
        {/* ── Header ── */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Edit Employee</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {employee.name}&nbsp;·&nbsp;
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{employee.employeeId}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={busy}>✕</button>
        </div>

        {/* ── Avatar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px 16px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={employee.name}
                style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
              />
            ) : (
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700,
              }}>
                {initials}
              </div>
            )}
            {avatarLoading && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="auth-spinner" style={{ width: 18, height: 18 }} />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              className="topbar-btn btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              Change Photo
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>JPEG, PNG or WebP · max 2 MB</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group full">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" placeholder="e.g. Jane Doe" value={form.name ?? ''} onChange={handleChange} disabled={busy} required />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" name="role" value={form.role ?? ''} onChange={handleChange} disabled={busy}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Join Date</label>
              <input className="form-input" name="joinDate" type="date" value={form.joinDate ?? ''} onChange={handleChange} disabled={busy} />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" name="department" value={form.department ?? ''} onChange={handleChange} disabled={busy || dropdownsLoading}>
                <option value="">— None —</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Manager</label>
              <select className="form-select" name="managerId" value={form.managerId ?? ''} onChange={handleChange} disabled={busy || dropdownsLoading}>
                <option value="">— None —</option>
                {managers.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.employeeId})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" name="phone" type="tel" placeholder="+1 234 567 8900" value={form.phone ?? ''} onChange={handleChange} disabled={busy} />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" name="dateOfBirth" type="date" value={form.dateOfBirth ?? ''} onChange={handleChange} disabled={busy} />
            </div>

            <div className="form-group full">
              <label className="form-label">Address</label>
              <input className="form-input" name="address" placeholder="123 Main St, City, State, ZIP" value={form.address ?? ''} onChange={handleChange} disabled={busy} />
            </div>

          </div>

          {error && (
            <div style={{
              margin: '0 20px 16px', padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, color: 'var(--red)', fontSize: 12, fontWeight: 500,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="form-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: busy ? 'default' : 'pointer',
                border: employee.status === 'active' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
                background: employee.status === 'active' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                color: employee.status === 'active' ? 'var(--red)' : 'var(--green)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {statusLoading ? 'Updating…' : employee.status === 'active' ? '⊘ Deactivate' : '✓ Activate'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="topbar-btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="topbar-btn btn-primary" disabled={busy} style={{ minWidth: 120, opacity: busy ? 0.65 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
