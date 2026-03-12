'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/apply-leave/FileUpload';
import DayCountPreview from '@/components/apply-leave/DayCountPreview';
import { listLeaveTypesApi, type ApiLeaveType } from '@/lib/leaveTypeApi';
import {
  submitLeaveApi,
  getMyBalancesApi,
  type ApiLeaveBalance,
} from '@/lib/leaveApi';
import { ApiError } from '@/lib/api';

// ── Client-side working-day estimate (Mon–Fri only) ───────────────────────────
function countWeekdays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ApplyLeavePage() {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate,   setStartDate]   = useState(todayStr());
  const [endDate,     setEndDate]     = useState(todayStr());
  const [reason,      setReason]      = useState('');
  const [file,        setFile]        = useState<File | null>(null);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [leaveTypes,  setLeaveTypes]  = useState<ApiLeaveType[]>([]);
  const [balances,    setBalances]    = useState<ApiLeaveBalance[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Submit state ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [submitted,  setSubmitted]  = useState(false);

  // ── Load leave types + balances on mount ──────────────────────────────────
  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      listLeaveTypesApi(),
      getMyBalancesApi(),
    ]).then(([types, bals]) => {
      setLeaveTypes(types);
      setBalances(bals);
      if (types.length > 0) setLeaveTypeId(types[0]._id);
    }).catch(() => {
      // Non-fatal: form still usable without balance preview
    }).finally(() => setLoadingData(false));
  }, []);

  // ── Preview calculations ───────────────────────────────────────────────────
  const estimatedDays = useMemo(
    () => countWeekdays(startDate, endDate),
    [startDate, endDate]
  );

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId?._id === leaveTypeId) ?? null,
    [balances, leaveTypeId]
  );

  const balanceAfterEst = selectedBalance
    ? Math.max(0, selectedBalance.remaining - estimatedDays)
    : 0;

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!leaveTypeId) { setError('Please select a leave type.'); return; }
    if (!startDate)   { setError('Start date is required.'); return; }
    if (!endDate)     { setError('End date is required.'); return; }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be on or before end date.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Attachment must be under 5 MB.');
      return;
    }

    setSubmitting(true);
    try {
      await submitLeaveApi(
        { leaveTypeId, startDate, endDate, reason: reason.trim() },
        file
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            color: 'var(--green)',
          }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
            Leave Request Submitted
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.6 }}>
            Your request has been sent to your manager for approval.
            You&apos;ll be notified by email once it&apos;s reviewed.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              className="topbar-btn btn-ghost"
              onClick={() => {
                setSubmitted(false);
                setReason('');
                setFile(null);
                setStartDate(todayStr());
                setEndDate(todayStr());
              }}
            >
              Apply Another
            </button>
            <button
              className="topbar-btn btn-primary"
              onClick={() => router.push('/my-requests')}
            >
              View My Requests →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 700 }}>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Apply for Leave</div>
              <div className="card-sub">Submit a new leave request for approval</div>
            </div>
          </div>

          <div className="form-grid">

            {/* Leave Type */}
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              {loadingData ? (
                <select className="form-select" disabled>
                  <option>Loading…</option>
                </select>
              ) : (
                <select
                  className="form-select"
                  value={leaveTypeId}
                  onChange={(e) => { setLeaveTypeId(e.target.value); setError(null); }}
                  disabled={submitting}
                  required
                >
                  {leaveTypes.length === 0 ? (
                    <option value="">No leave types available</option>
                  ) : (
                    leaveTypes.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.code})
                      </option>
                    ))
                  )}
                </select>
              )}

              {/* Remaining balance pill */}
              {selectedBalance && !loadingData && (
                <div style={{
                  marginTop: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: selectedBalance.remaining > 0 ? 'var(--green)' : 'var(--red)',
                  background: selectedBalance.remaining > 0
                    ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${selectedBalance.remaining > 0
                    ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: 5,
                  padding: '2px 8px',
                }}>
                  Balance:&nbsp;<b>{selectedBalance.remaining}</b>&nbsp;
                  day{selectedBalance.remaining !== 1 ? 's' : ''} available
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                className="form-input"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setError(null); }}
                disabled={submitting}
                required
              />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                className="form-input"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => { setEndDate(e.target.value); setError(null); }}
                disabled={submitting}
                required
              />
            </div>

            {/* Reason */}
            <div className="form-group full">
              <label className="form-label">Reason *</label>
              <textarea
                className="form-textarea"
                placeholder="Briefly describe the reason for your leave… (min. 5 characters)"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(null); }}
                disabled={submitting}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Attachment */}
            <div className="form-group full">
              <label className="form-label">Attachment (optional)</label>
              <FileUpload file={file} onChange={setFile} disabled={submitting} />
            </div>

          </div>

          {/* Day count preview */}
          {startDate && endDate && (
            <DayCountPreview
              workingDays={estimatedDays}
              balanceAfter={balanceAfterEst}
              conflicts={0}
            />
          )}

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

          <div className="form-footer">
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {estimatedDays > 0 && (
                <span>~{estimatedDays} working day{estimatedDays !== 1 ? 's' : ''} (estimate)</span>
              )}
            </div>
            <button
              type="submit"
              className="topbar-btn btn-primary"
              disabled={submitting || loadingData || leaveTypes.length === 0}
              style={{ minWidth: 160, opacity: submitting ? 0.65 : 1 }}
            >
              {submitting ? 'Submitting…' : 'Submit Request →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
