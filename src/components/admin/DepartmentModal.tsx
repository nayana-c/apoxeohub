'use client';

import { useState, useEffect } from 'react';
import {
  createDepartmentApi,
  updateDepartmentApi,
  listDepartmentsApi,
  type ApiDepartment,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
} from '@/lib/departmentApi';
import { listEmployeesApi } from '@/lib/employeeApi';
import { ApiError } from '@/lib/api';
import type { ApiEmployee } from '@/types';

interface Props {
  /** Pass an existing department to switch to edit mode; omit for create mode. */
  department?: ApiDepartment | null;
  onClose: () => void;
  onSaved: (department: ApiDepartment) => void;
}

const isEditMode = (dept: ApiDepartment | null | undefined): dept is ApiDepartment =>
  !!dept;

type FormState = {
  name: string;
  code: string;
  location: string;
  headId: string;
  parentId: string;
};

export default function DepartmentModal({ department, onClose, onSaved }: Props) {
  const editMode = isEditMode(department);

  const [form, setForm] = useState<FormState>({
    name:     department?.name     ?? '',
    code:     department?.code     ?? '',
    location: department?.location ?? '',
    headId:   department?.headId?._id  ?? '',
    parentId: department?.parentId?._id ?? '',
  });
  const [isActive, setIsActive] = useState(department?.isActive ?? true);

  const [employees, setEmployees]     = useState<ApiEmployee[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // ── Load dropdown data ───────────────────────────────────────────────────
  useEffect(() => {
    setDropdownsLoading(true);
    Promise.all([
      // All active employees for the Head dropdown
      listEmployeesApi({ limit: 200, status: 'active', sortBy: 'name', sortOrder: 'asc' })
        .then((r) => r.data)
        .catch(() => [] as ApiEmployee[]),
      // All departments (including inactive) for Parent dropdown
      listDepartmentsApi(true).catch(() => [] as ApiDepartment[]),
    ]).then(([emps, depts]) => {
      setEmployees(emps);
      // Exclude self from parent options in edit mode
      setDepartments(
        editMode ? depts.filter((d) => d._id !== department._id) : depts
      );
    }).finally(() => setDropdownsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Field change ─────────────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) { setError('Department name is required.'); return; }
    if (!form.code.trim()) { setError('Department code is required.'); return; }
    if (!/^[A-Z0-9_]{2,10}$/.test(form.code)) {
      setError('Code must be 2–10 uppercase letters, numbers, or underscores.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      let saved: ApiDepartment;

      if (editMode) {
        const payload: UpdateDepartmentPayload = {
          name:     form.name     || undefined,
          code:     form.code     || undefined,
          location: form.location || undefined,
          headId:   form.headId   || null,
          parentId: form.parentId || null,
          isActive,
        };
        saved = await updateDepartmentApi(department._id, payload);
      } else {
        const payload: CreateDepartmentPayload = {
          name:     form.name,
          code:     form.code,
          location: form.location || undefined,
          headId:   form.headId   || undefined,
          parentId: form.parentId || undefined,
        };
        saved = await createDepartmentApi(payload);
      }

      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="modal">
        {/* ── Header ── */}
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {editMode ? 'Edit Department' : 'Add Department'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {editMode
                ? `${department.name} · ${department.code}`
                : 'Create a new organisational department.'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Name */}
            <div className="form-group full">
              <label className="form-label">Department Name *</label>
              <input
                className="form-input"
                name="name"
                placeholder="e.g. Engineering"
                value={form.name}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            {/* Code */}
            <div className="form-group">
              <label className="form-label">
                Code *
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6, fontWeight: 400 }}>
                  2–10 chars, A–Z 0–9 _
                </span>
              </label>
              <input
                className="form-input"
                name="code"
                placeholder="e.g. ENG"
                value={form.code}
                onChange={handleChange}
                disabled={saving}
                style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}
                maxLength={10}
                required
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                name="location"
                placeholder="e.g. Bangalore"
                value={form.location}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* Department Head */}
            <div className="form-group">
              <label className="form-label">Department Head</label>
              <select
                className="form-select"
                name="headId"
                value={form.headId}
                onChange={handleChange}
                disabled={saving || dropdownsLoading}
              >
                <option value="">— None —</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} ({e.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Department */}
            <div className="form-group">
              <label className="form-label">Parent Department</label>
              <select
                className="form-select"
                name="parentId"
                value={form.parentId}
                onChange={handleChange}
                disabled={saving || dropdownsLoading}
              >
                <option value="">— None (root) —</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active toggle — edit mode only */}
            {editMode && (
              <div className="form-group full" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Status</label>
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: saving ? 'default' : 'pointer',
                    border: isActive
                      ? '1px solid rgba(16,185,129,0.3)'
                      : '1px solid rgba(239,68,68,0.3)',
                    background: isActive
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(239,68,68,0.08)',
                    color: isActive ? 'var(--green)' : 'var(--red)',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {isActive ? '● Active' : '○ Inactive'}
                </button>
              </div>
            )}

          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              margin: '0 20px 16px',
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
              color: 'var(--red)',
              fontSize: 12,
              fontWeight: 500,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="form-footer">
            <button
              type="button"
              className="topbar-btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="topbar-btn btn-primary"
              disabled={saving}
              style={{ minWidth: 140, opacity: saving ? 0.65 : 1 }}
            >
              {saving
                ? (editMode ? 'Saving…' : 'Creating…')
                : (editMode ? 'Save Changes' : '+ Add Department')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
