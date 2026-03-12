'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listPendingApprovalsApi,
  approveLeaveApi,
  rejectLeaveApi,
  type ApiLeaveRequest,
} from '@/lib/leaveApi';
import type { ApiLeaveType } from '@/lib/leaveTypeApi';
import { ApiError } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['default', 'green', 'amber', 'blue', 'red'] as const;
function avatarColor(id: string) {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateRange(start: string, end: string) {
  const s = formatDate(start);
  const e = formatDate(end);
  return s === e ? s : `${s} – ${e}`;
}

// ── Inline reject form ────────────────────────────────────────────────────────

interface RejectRowProps {
  leaveId: string;
  onRejected: (id: string) => void;
  onCancel: () => void;
}

function RejectRow({ leaveId, onRejected, onCancel }: RejectRowProps) {
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleReject() {
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Rejection reason must be at least 5 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await rejectLeaveApi(leaveId, comment.trim());
      onRejected(leaveId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Rejection failed.');
      setSaving(false);
    }
  }

  return (
    <tr style={{ background: 'rgba(239,68,68,0.03)' }}>
      <td colSpan={8} style={{ padding: '10px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
          Rejection reason <b style={{ color: 'var(--red)' }}>*</b>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter reason for rejection…"
            value={comment}
            onChange={(e) => { setComment(e.target.value); setError(null); }}
            disabled={saving}
            style={{
              flex: 1,
              minWidth: 240,
              padding: '6px 10px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--bg-2)',
              color: 'var(--text-1)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
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
              className="tbl-btn reject"
              onClick={handleReject}
              disabled={saving}
              style={{ fontSize: 12, minWidth: 110, opacity: saving ? 0.65 : 1 }}
            >
              {saving ? 'Rejecting…' : '✕ Confirm Reject'}
            </button>
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>⚠ {error}</div>
        )}
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function ApprovalsTable() {
  const [requests,    setRequests]    = useState<ApiLeaveRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);

  const [rejectingId,  setRejectingId]  = useState<string | null>(null);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [actionError,  setActionError]  = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    setRejectingId(null);
    try {
      const result = await listPendingApprovalsApi({ page, limit: PAGE_SIZE, status: 'pending', sortBy: 'appliedOn', sortOrder: 'desc' });
      setRequests(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.meta?.pages ?? 1);
      setTotal(result.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pending approvals.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  // ── Approve ────────────────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    setApprovingIds((prev) => new Set(prev).add(id));
    setActionError(null);
    try {
      await approveLeaveApi(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Approval failed.');
    } finally {
      setApprovingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  // ── After reject ──────────────────────────────────────────────────────────
  function handleRejected(id: string) {
    setRejectingId(null);
    setRequests((prev) => prev.filter((r) => r._id !== id));
    setTotal((t) => t - 1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Pending Approvals</div>
          <div className="card-sub">
            {loading ? 'Loading…' : `${total} request${total !== 1 ? 's' : ''} awaiting your action`}
          </div>
        </div>
      </div>

      {actionError && (
        <div style={{
          margin: '0 20px 12px',
          padding: '8px 14px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 7,
          fontSize: 12,
          color: 'var(--red)',
        }}>
          ⚠ {actionError}
        </div>
      )}

      <div className="table-wrap">
        {error ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
            ⚠ {error}
            <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchApprovals}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Loading…
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No pending approvals
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const emp         = typeof r.employeeId === 'object' ? r.employeeId : null;
                const empName     = emp?.name ?? '—';
                const empId       = emp?._id  ?? String(r.employeeId);
                const leaveType   = r.leaveTypeId as ApiLeaveType;
                const isApproving = approvingIds.has(r._id);
                const isRejecting = rejectingId === r._id;

                return (
                  <>
                    <tr
                      key={r._id}
                      style={{
                        borderBottom: isRejecting ? 'none' : '1px solid var(--border)',
                        background: isRejecting ? 'rgba(239,68,68,0.03)' : undefined,
                      }}
                    >
                      {/* Employee */}
                      <td>
                        <div className="td-name">
                          <Avatar
                            initials={getInitials(empName)}
                            color={avatarColor(empId)}
                            size="sm"
                          />
                          <span>{empName}</span>
                        </div>
                      </td>

                      {/* Leave type */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                            {leaveType?.name ?? '—'}
                          </span>
                          {leaveType?.code && (
                            <span style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              background: 'rgba(99,102,241,0.1)',
                              color: 'var(--purple)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: 4,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              {leaveType.code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ fontSize: 13 }}>
                        {formatDateRange(r.startDate, r.endDate)}
                      </td>

                      {/* Days */}
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                          {r.totalDays}
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 13,
                        color: 'var(--text-2)',
                      }}>
                        {r.reason}
                      </td>

                      {/* Applied on */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {formatDate(r.appliedOn)}
                      </td>

                      {/* Status */}
                      <td>
                        <Badge status={r.status} />
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="tbl-btn approve"
                            onClick={() => handleApprove(r._id)}
                            disabled={isApproving || isRejecting}
                            style={{ opacity: isApproving ? 0.5 : 1 }}
                          >
                            {isApproving ? '…' : '✓ Approve'}
                          </button>
                          <button
                            className="tbl-btn reject"
                            onClick={() => setRejectingId(isRejecting ? null : r._id)}
                            disabled={isApproving}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline reject form */}
                    {isRejecting && (
                      <RejectRow
                        key={`rej-${r._id}`}
                        leaveId={r._id}
                        onRejected={handleRejected}
                        onCancel={() => setRejectingId(null)}
                      />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && total > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text-3)',
        }}>
          <span>
            {total} total · Page {page} of {Math.max(1, totalPages)}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="tbl-btn view"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              ← Prev
            </button>
            <button
              className="tbl-btn view"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
