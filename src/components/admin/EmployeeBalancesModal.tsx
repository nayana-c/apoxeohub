'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getEmployeeBalancesApi,
  adjustBalanceApi,
  type ApiBalanceRecord,
} from '@/lib/leaveApi';
import { ApiError } from '@/lib/api';
import type { ApiEmployee } from '@/types';

interface Props {
  employee: ApiEmployee;
  onClose: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// ── Remaining-days colour ─────────────────────────────────────────────────────
function remainingColor(remaining: number): string {
  if (remaining <= 0)  return 'var(--red)';
  if (remaining <= 3)  return 'var(--amber)';
  return 'var(--green)';
}

// ── Inline adjust row ─────────────────────────────────────────────────────────
interface AdjustRowProps {
  record: ApiBalanceRecord;
  onSaved: (updated: { _id: string; adjusted: number; remaining: number }) => void;
  onCancel: () => void;
  userId: string;
}

function AdjustRow({ record, onSaved, onCancel, userId }: AdjustRowProps) {
  const [delta,   setDelta]   = useState('');
  const [reason,  setReason]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const parsedDelta = parseFloat(delta);
  const previewRemaining = !isNaN(parsedDelta)
    ? Math.max(0, record.remaining + parsedDelta)
    : record.remaining;

  async function handleSave() {
    if (delta === '' || isNaN(parsedDelta) || parsedDelta === 0) {
      setError('Enter a non-zero adjustment value.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Reason must be at least 3 characters.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await adjustBalanceApi(userId, record.leaveType._id, parsedDelta, reason.trim());
      onSaved(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Adjustment failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
      <td colSpan={7} style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
          Adjusting: <b style={{ color: 'var(--text-1)' }}>{record.leaveType.name}</b>
          &nbsp;· Current remaining: <b style={{ color: remainingColor(record.remaining) }}>
            {record.remaining}
          </b> days
          &nbsp;· After adjustment: <b style={{ color: remainingColor(previewRemaining) }}>
            {previewRemaining}
          </b> days
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Delta input */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
              Adjustment (+ add / − remove)
            </div>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. +3 or −2"
              value={delta}
              onChange={(e) => { setDelta(e.target.value); setError(null); }}
              disabled={saving}
              style={{
                width: 120,
                padding: '6px 10px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'var(--bg-2)',
                color: 'var(--text-1)',
                fontSize: 13,
                outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>

          {/* Reason input */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Reason *</div>
            <input
              type="text"
              placeholder="e.g. Annual bonus leave, error correction…"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null); }}
              disabled={saving}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '6px 10px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'var(--bg-2)',
                color: 'var(--text-1)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="topbar-btn btn-ghost"
              onClick={onCancel}
              disabled={saving}
              style={{ fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="topbar-btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ fontSize: 12, minWidth: 80, opacity: saving ? 0.65 : 1 }}
            >
              {saving ? 'Saving…' : 'Apply'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            ⚠ {error}
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function EmployeeBalancesModal({ employee, onClose }: Props) {
  const [year,     setYear]     = useState(CURRENT_YEAR);
  const [records,  setRecords]  = useState<ApiBalanceRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Which row's adjust form is open (_id of record, or null)
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // ── Fetch balances ──────────────────────────────────────────────────────────
  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAdjustingId(null);
    try {
      const data = await getEmployeeBalancesApi(employee._id, year);
      setRecords(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load balances.');
    } finally {
      setLoading(false);
    }
  }, [employee._id, year]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  // ── After a successful adjustment ──────────────────────────────────────────
  function handleAdjusted(
    recordId: string,
    updated: { _id: string; adjusted: number; remaining: number }
  ) {
    setAdjustingId(null);
    setRecords((prev) =>
      prev.map((r) =>
        r._id === recordId
          ? { ...r, adjusted: updated.adjusted, remaining: updated.remaining }
          : r
      )
    );
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalAllocated = records.reduce((s, r) => s + r.allocated + r.carried + r.adjusted, 0);
  const totalUsed      = records.reduce((s, r) => s + r.used, 0);
  const totalRemaining = records.reduce((s, r) => s + r.remaining, 0);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !adjustingId) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 760, width: '95vw' }}>
        {/* ── Header ── */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Leave Balances</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {employee.name}&nbsp;·&nbsp;
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {employee.employeeId}
              </span>
              {employee.department && (
                <>&nbsp;·&nbsp;{employee.department.name}</>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Year selector */}
            <select
              className="form-select"
              style={{ width: 90 }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '0 20px 20px' }}>
          {error ? (
            <div style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--red)',
              fontSize: 13,
            }}>
              ⚠ {error}
              <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchBalances}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading balances…
            </div>
          ) : records.length === 0 ? (
            <div style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text-3)',
              fontSize: 13,
            }}>
              No balance records found for {year}.
              <div style={{ fontSize: 12, marginTop: 6 }}>
                Balances are initialised when an employee is created or the year-end rollover runs.
              </div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        Leave Type
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                        Allocated
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                        Carry Fwd
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                        Manual Adj.
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                        Used
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                        Remaining
                      </th>
                      <th style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', width: 80 }}>
                        {/* actions */}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <>
                        <tr
                          key={r._id}
                          style={{
                            borderBottom: adjustingId === r._id ? 'none' : '1px solid var(--border)',
                            background: adjustingId === r._id ? 'rgba(99,102,241,0.04)' : undefined,
                          }}
                        >
                          {/* Leave type */}
                          <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                                {r.leaveType.name}
                              </span>
                              <span style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                background: 'rgba(99,102,241,0.1)',
                                color: 'var(--purple)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: 4,
                                fontFamily: "'JetBrains Mono', monospace",
                                letterSpacing: 0.4,
                              }}>
                                {r.leaveType.code}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                              {r.leaveType.accrualType === 'annual'  && 'Annual accrual'}
                              {r.leaveType.accrualType === 'monthly' && 'Monthly accrual'}
                              {r.leaveType.accrualType === 'none'    && 'No accrual'}
                            </div>
                          </td>

                          {/* Allocated */}
                          <td style={{ textAlign: 'right', padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-2)' }}>
                            {r.allocated}
                          </td>

                          {/* Carry forward */}
                          <td style={{ textAlign: 'right', padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: r.carried > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                            {r.carried > 0 ? `+${r.carried}` : '—'}
                          </td>

                          {/* Manual adjustment */}
                          <td style={{ textAlign: 'right', padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                            {r.adjusted === 0 ? (
                              <span style={{ color: 'var(--text-3)' }}>—</span>
                            ) : (
                              <span style={{ color: r.adjusted > 0 ? 'var(--green)' : 'var(--red)' }}>
                                {r.adjusted > 0 ? `+${r.adjusted}` : r.adjusted}
                              </span>
                            )}
                          </td>

                          {/* Used */}
                          <td style={{ textAlign: 'right', padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: r.used > 0 ? 'var(--amber)' : 'var(--text-3)' }}>
                            {r.used > 0 ? r.used : '—'}
                          </td>

                          {/* Remaining — highlighted */}
                          <td style={{ textAlign: 'right', padding: '10px 10px' }}>
                            <span style={{
                              display: 'inline-block',
                              minWidth: 42,
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 13,
                              fontWeight: 700,
                              textAlign: 'center',
                              color: remainingColor(r.remaining),
                              background: r.remaining <= 0
                                ? 'rgba(239,68,68,0.1)'
                                : r.remaining <= 3
                                  ? 'rgba(245,158,11,0.1)'
                                  : 'rgba(16,185,129,0.1)',
                              border: `1px solid ${
                                r.remaining <= 0
                                  ? 'rgba(239,68,68,0.2)'
                                  : r.remaining <= 3
                                    ? 'rgba(245,158,11,0.2)'
                                    : 'rgba(16,185,129,0.2)'
                              }`,
                            }}>
                              {r.remaining}
                            </span>
                          </td>

                          {/* Adjust button */}
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            {year === CURRENT_YEAR ? (
                              <button
                                className="tbl-btn view"
                                onClick={() => setAdjustingId(adjustingId === r._id ? null : r._id)}
                                style={{
                                  fontSize: 11,
                                  background: adjustingId === r._id ? 'rgba(99,102,241,0.15)' : undefined,
                                }}
                              >
                                {adjustingId === r._id ? 'Cancel' : 'Adjust'}
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                            )}
                          </td>
                        </tr>

                        {/* Inline adjust form */}
                        {adjustingId === r._id && (
                          <AdjustRow
                            key={`adj-${r._id}`}
                            record={r}
                            userId={employee._id}
                            onSaved={(updated) => handleAdjusted(r._id, updated)}
                            onCancel={() => setAdjustingId(null)}
                          />
                        )}
                      </>
                    ))}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                        Total
                      </td>
                      <td colSpan={3} style={{ textAlign: 'right', padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-2)' }}>
                        {totalAllocated} total entitlement
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--amber)' }}>
                        {totalUsed} used
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          fontWeight: 700,
                          color: remainingColor(totalRemaining),
                          background: totalRemaining <= 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          border: `1px solid ${totalRemaining <= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        }}>
                          {totalRemaining}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Legend */}
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-3)',
                display: 'flex',
                gap: 20,
                flexWrap: 'wrap',
              }}>
                <span>
                  <b style={{ color: 'var(--text-2)', fontFamily: "'JetBrains Mono', monospace" }}>Remaining</b>
                  &nbsp;= Allocated + Carry Fwd + Manual Adj. − Used
                </span>
                <span>
                  <b style={{ color: 'var(--text-2)' }}>Manual Adj.</b>
                  &nbsp;accumulates — positive adds days, negative removes them
                </span>
                {year !== CURRENT_YEAR && (
                  <span style={{ color: 'var(--amber)' }}>
                    ⚠ Adjustments are only allowed for the current year ({CURRENT_YEAR})
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="form-footer">
          <button type="button" className="topbar-btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
