'use client';

import { useState } from 'react';
import { createEmployeeApi, type CreateEmployeePayload } from '@/lib/employeeApi';
import { ApiError } from '@/lib/api';
import type { ApiEmployee } from '@/types';

interface Props {
  onClose: () => void;
  onCreated: (employee: ApiEmployee) => void;
}

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr',      label: 'HR' },
  { value: 'admin',   label: 'Admin' },
] as const;

const defaultForm: CreateEmployeePayload = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  joinDate: new Date().toISOString().split('T')[0],
};

export default function CreateEmployeeModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateEmployeePayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value || undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const employee = await createEmployeeApi(form);
      onCreated(employee);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Add New Employee</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              They'll be prompted to set a new password on first login.
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Full Name */}
            <div className="form-group full">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                name="name"
                placeholder="e.g. Jane Doe"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group full">
              <label className="form-label">Work Email *</label>
              <input
                className="form-input"
                name="email"
                type="email"
                placeholder="jane@company.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group full">
              <label className="form-label">Temporary Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  style={{ paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', fontSize: 14, padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className="form-select"
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Join Date */}
            <div className="form-group">
              <label className="form-label">Join Date</label>
              <input
                className="form-input"
                name="joinDate"
                type="date"
                value={form.joinDate ?? ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Optional fields toggle */}
          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              margin: '4px 20px 8px', padding: '4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 12, fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 10 }}>{showOptional ? '▼' : '▶'}</span>
            Additional details (optional)
          </button>

          {showOptional && (
            <div className="form-grid" style={{ paddingTop: 0 }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  name="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phone ?? ''}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  className="form-input"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth ?? ''}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  name="address"
                  placeholder="123 Main St, City, State, ZIP"
                  value={form.address ?? ''}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Error */}
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

          {/* Footer */}
          <div className="form-footer">
            <button
              type="button"
              className="topbar-btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="topbar-btn btn-primary"
              disabled={loading}
              style={{ minWidth: 130 }}
            >
              {loading ? 'Creating…' : '+ Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
