'use client';

import { useState } from 'react';
import {
  createHolidayApi,
  updateHolidayApi,
  type ApiHoliday,
  type HolidayPayload,
  type HolidayType,
} from '@/lib/holidayApi';
import { ApiError } from '@/lib/api';

interface Props {
  /** Pass an existing holiday to switch to edit mode; omit for create mode. */
  holiday?: ApiHoliday | null;
  onClose: () => void;
  onSaved: (holiday: ApiHoliday) => void;
}

const HOLIDAY_TYPES: { value: HolidayType; label: string; color: string }[] = [
  { value: 'public',   label: 'Public Holiday',   color: 'var(--green)'  },
  { value: 'company',  label: 'Company Holiday',  color: 'var(--accent)' },
  { value: 'optional', label: 'Optional Holiday', color: 'var(--text-2)' },
];

type FormState = {
  name: string;
  date: string;
  type: HolidayType;
  country: string;
  location: string;
};

export default function HolidayModal({ holiday, onClose, onSaved }: Props) {
  const editMode = !!holiday;

  const [form, setForm] = useState<FormState>({
    name:     holiday?.name     ?? '',
    date:     holiday?.date     ? holiday.date.split('T')[0] : '',
    type:     holiday?.type     ?? 'public',
    country:  holiday?.country  ?? 'IN',
    location: holiday?.location ?? 'all',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) { setError('Holiday name is required.'); return; }
    if (!form.date)        { setError('Date is required.'); return; }

    setError(null);
    setSaving(true);

    const payload: HolidayPayload = {
      name:     form.name.trim(),
      date:     form.date,
      type:     form.type,
      country:  form.country.trim() || undefined,
      location: form.location.trim() || undefined,
    };

    try {
      const saved = editMode
        ? await updateHolidayApi(holiday._id, payload)
        : await createHolidayApi(payload);
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
              {editMode ? 'Edit Holiday' : 'Add Holiday'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {editMode
                ? `${holiday.name} · ${new Date(holiday.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                : 'Add a new holiday to the calendar.'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Name */}
            <div className="form-group full">
              <label className="form-label">Holiday Name *</label>
              <input
                className="form-input"
                name="name"
                placeholder="e.g. Republic Day"
                value={form.name}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                className="form-input"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            {/* Type */}
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select
                className="form-select"
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={saving}
              >
                {HOLIDAY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="form-group">
              <label className="form-label">Country Code</label>
              <input
                className="form-input"
                name="country"
                placeholder="e.g. IN"
                value={form.country}
                onChange={handleChange}
                disabled={saving}
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">
                Location
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6, fontWeight: 400 }}>
                  "all" = applies everywhere
                </span>
              </label>
              <input
                className="form-input"
                name="location"
                placeholder="e.g. Bangalore or all"
                value={form.location}
                onChange={handleChange}
                disabled={saving}
              />
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
                ? (editMode ? 'Saving…' : 'Adding…')
                : (editMode ? 'Save Changes' : '+ Add Holiday')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
