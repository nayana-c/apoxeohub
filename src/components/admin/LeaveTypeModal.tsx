'use client';

import { useState, useEffect } from 'react';
import {
  createLeaveTypeApi,
  updateLeaveTypeApi,
  type ApiLeaveType,
  type LeaveTypePayload,
  type AccrualType,
} from '@/lib/leaveTypeApi';
import { listDepartmentsApi, type ApiDepartment } from '@/lib/departmentApi';
import { ApiError } from '@/lib/api';

interface Props {
  leaveType?: ApiLeaveType | null;
  onClose: () => void;
  onSaved: (leaveType: ApiLeaveType) => void;
}

type FormState = {
  name: string;
  code: string;
  description: string;
  defaultDays: string;
  carryForwardMax: string;
  accrualType: AccrualType;
  requiresDoc: boolean;
  minNoticeDays: string;
  maxConsecutive: string;
  applicableTo: string[];
};

const ACCRUAL_OPTIONS: { value: AccrualType; label: string; desc: string }[] = [
  { value: 'annual',  label: 'Annual',  desc: 'Full balance credited once a year' },
  { value: 'monthly', label: 'Monthly', desc: 'Balance accrues each month' },
  { value: 'none',    label: 'None',    desc: 'No automatic accrual' },
];

function toFormState(lt?: ApiLeaveType | null): FormState {
  return {
    name:           lt?.name          ?? '',
    code:           lt?.code          ?? '',
    description:    lt?.description   ?? '',
    defaultDays:    lt != null ? String(lt.defaultDays)    : '',
    carryForwardMax: lt != null ? String(lt.carryForwardMax) : '0',
    accrualType:    lt?.accrualType   ?? 'annual',
    requiresDoc:    lt?.requiresDoc   ?? false,
    minNoticeDays:  lt != null ? String(lt.minNoticeDays)  : '0',
    maxConsecutive: lt != null ? String(lt.maxConsecutive) : '0',
    applicableTo:   lt?.applicableTo?.map((d) => d._id) ?? [],
  };
}

export default function LeaveTypeModal({ leaveType, onClose, onSaved }: Props) {
  const editMode = !!leaveType;

  const [form, setForm]             = useState<FormState>(toFormState(leaveType));
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Load departments for applicableTo ─────────────────────────────────────
  useEffect(() => {
    setDeptsLoading(true);
    listDepartmentsApi()
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setDeptsLoading(false));
  }, []);

  // ── Field handlers ────────────────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
  }

  function handleToggleDoc() {
    setForm((prev) => ({ ...prev, requiresDoc: !prev.requiresDoc }));
  }

  function handleDeptToggle(deptId: string) {
    setForm((prev) => {
      const has = prev.applicableTo.includes(deptId);
      return {
        ...prev,
        applicableTo: has
          ? prev.applicableTo.filter((id) => id !== deptId)
          : [...prev.applicableTo, deptId],
      };
    });
  }

  // ── Validate + submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim())       { setError('Name is required.');        return; }
    if (!form.code.trim())       { setError('Code is required.');        return; }
    if (!/^[A-Z0-9]{1,5}$/.test(form.code)) {
      setError('Code must be 1–5 uppercase letters or numbers.');
      return;
    }
    const days = Number(form.defaultDays);
    if (isNaN(days) || days < 0) { setError('Default days must be 0 or more.'); return; }

    setError(null);
    setSaving(true);

    const payload: LeaveTypePayload = {
      name:           form.name.trim(),
      code:           form.code,
      description:    form.description.trim(),
      defaultDays:    days,
      carryForwardMax: Number(form.carryForwardMax) || 0,
      accrualType:    form.accrualType,
      requiresDoc:    form.requiresDoc,
      minNoticeDays:  Number(form.minNoticeDays)  || 0,
      maxConsecutive: Number(form.maxConsecutive) || 0,
      applicableTo:   form.applicableTo,
    };

    try {
      const saved = editMode
        ? await updateLeaveTypeApi(leaveType._id, payload)
        : await createLeaveTypeApi(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Number input helper ───────────────────────────────────────────────────
  const numInput = (
    label: string,
    name: keyof FormState,
    hint?: string,
    min = 0
  ) => (
    <div className="form-group">
      <label className="form-label">
        {label}
        {hint && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6, fontWeight: 400 }}>{hint}</span>}
      </label>
      <input
        className="form-input"
        type="number"
        name={name}
        min={min}
        value={form[name] as string}
        onChange={handleChange}
        disabled={saving}
      />
    </div>
  );

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {editMode ? 'Edit Leave Type' : 'Add Leave Type'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {editMode ? `${leaveType.name} · ${leaveType.code}` : 'Define a new leave policy.'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Name */}
            <div className="form-group full">
              <label className="form-label">Name *</label>
              <input
                className="form-input"
                name="name"
                placeholder="e.g. Annual Leave"
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
                  1–5 chars, A–Z 0–9
                </span>
              </label>
              <input
                className="form-input"
                name="code"
                placeholder="e.g. AL"
                value={form.code}
                onChange={handleChange}
                disabled={saving}
                maxLength={5}
                style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}
                required
              />
            </div>

            {/* Accrual Type */}
            <div className="form-group">
              <label className="form-label">Accrual Type</label>
              <select
                className="form-select"
                name="accrualType"
                value={form.accrualType}
                onChange={handleChange}
                disabled={saving}
              >
                {ACCRUAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
                ))}
              </select>
            </div>

            {/* Default Days */}
            {numInput('Default Days *', 'defaultDays', 'allocated per year')}

            {/* Carry Forward Max */}
            {numInput('Carry Forward Max', 'carryForwardMax', '0 = none')}

            {/* Min Notice Days */}
            {numInput('Min Notice Days', 'minNoticeDays', '0 = no minimum')}

            {/* Max Consecutive */}
            {numInput('Max Consecutive Days', 'maxConsecutive', '0 = no limit')}

            {/* Requires Document */}
            <div className="form-group full" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Requires Supporting Document</label>
              <button
                type="button"
                onClick={handleToggleDoc}
                disabled={saving}
                style={{
                  padding: '5px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: saving ? 'default' : 'pointer',
                  border: form.requiresDoc
                    ? '1px solid rgba(16,185,129,0.3)'
                    : '1px solid var(--border)',
                  background: form.requiresDoc
                    ? 'rgba(16,185,129,0.08)'
                    : 'var(--surface-2)',
                  color: form.requiresDoc ? 'var(--green)' : 'var(--text-3)',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {form.requiresDoc ? '✓ Yes' : '○ No'}
              </button>
            </div>

            {/* Description */}
            <div className="form-group full">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                name="description"
                placeholder="Optional description of this leave policy…"
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                rows={2}
                style={{ resize: 'vertical', minHeight: 60 }}
              />
            </div>

            {/* Applicable To */}
            <div className="form-group full">
              <label className="form-label">
                Applicable To
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6, fontWeight: 400 }}>
                  leave unchecked for all departments
                </span>
              </label>
              {deptsLoading ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
                  Loading departments…
                </div>
              ) : departments.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
                  No departments available.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '10px 0',
                }}>
                  {departments.map((dept) => {
                    const checked = form.applicableTo.includes(dept._id);
                    return (
                      <button
                        key={dept._id}
                        type="button"
                        onClick={() => handleDeptToggle(dept._id)}
                        disabled={saving}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: saving ? 'default' : 'pointer',
                          border: checked
                            ? '1px solid rgba(99,102,241,0.4)'
                            : '1px solid var(--border)',
                          background: checked
                            ? 'rgba(99,102,241,0.12)'
                            : 'var(--surface-2)',
                          color: checked ? 'var(--purple)' : 'var(--text-3)',
                          opacity: saving ? 0.6 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {checked ? '✓ ' : ''}{dept.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {form.applicableTo.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  ✦ Applies to all departments
                </div>
              )}
            </div>

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
                : (editMode ? 'Save Changes' : '+ Add Leave Type')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
