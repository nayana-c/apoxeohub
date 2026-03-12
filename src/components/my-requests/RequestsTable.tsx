'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listMyLeavesApi,
  cancelLeaveApi,
  type ApiLeaveRequest,
  type ListLeavesParams,
} from '@/lib/leaveApi';
import { listLeaveTypesApi, type ApiLeaveType } from '@/lib/leaveTypeApi';
import { ApiError } from '@/lib/api';
import type { LeaveStatus } from '@/types';
import Badge from '@/components/ui/Badge';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const STATUS_OPTIONS: { value: LeaveStatus | ''; label: string }[] = [
  { value: '',          label: 'All Status'  },
  { value: 'pending',   label: 'Pending'     },
  { value: 'approved',  label: 'Approved'    },
  { value: 'rejected',  label: 'Rejected'    },
  { value: 'cancelled', label: 'Cancelled'   },
];

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ leave, onClose }: { leave: ApiLeaveRequest; onClose: () => void }) {
  const leaveType = leave.leaveTypeId as ApiLeaveType;
  const lastApproval = leave.approvals[leave.approvals.length - 1] ?? null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Leave Request Details</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {leaveType?.name} · {formatDateRange(leave.startDate, leave.endDate)}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '4px 20px 20px' }}>
          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <Badge status={leave.status} />
          </div>

          {/* Details grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 20px',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {([
              ['Leave Type',  leaveType?.name ?? '—'],
              ['Days',        `${leave.totalDays} working day${leave.totalDays !== 1 ? 's' : ''}`],
              ['Start Date',  formatDate(leave.startDate)],
              ['End Date',    formatDate(leave.endDate)],
              ['Applied On',  formatDate(leave.appliedOn)],
              ['Attachment',  leave.attachmentName ?? 'None'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{label}</div>
                <div style={{ color: 'var(--text-1)', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Reason</div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-2)',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              lineHeight: 1.5,
            }}>
              {leave.reason}
            </div>
          </div>

          {/* Approval info */}
          {lastApproval && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                {leave.status === 'approved' ? 'Approved by' : 'Rejected by'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {lastApproval.approverId?.name ?? 'Manager'}
                {lastApproval.comment && (
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-3)' }}>
                    &ldquo;{lastApproval.comment}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {leave.comments.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                Comments ({leave.comments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leave.comments.map((c, i) => (
                  <div key={i} style={{
                    fontSize: 12,
                    color: 'var(--text-2)',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    padding: '8px 12px',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                      {c.userId?.name ?? 'User'}
                    </span>
                    <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: 11 }}>
                      {formatDate(c.createdAt)}
                    </span>
                    <div style={{ marginTop: 4 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-footer">
          <button type="button" className="topbar-btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RequestsTable() {
  const [requests,    setRequests]    = useState<ApiLeaveRequest[]>([]);
  const [leaveTypes,  setLeaveTypes]  = useState<ApiLeaveType[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Filters
  const [statusFilter,    setStatusFilter]    = useState<LeaveStatus | ''>('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [search,          setSearch]          = useState('');

  // Pagination
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 15;

  // Actions
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [viewingLeave, setViewingLeave] = useState<ApiLeaveRequest | null>(null);

  // ── Load leave types for filter dropdown ──────────────────────────────────
  useEffect(() => {
    listLeaveTypesApi()
      .then(setLeaveTypes)
      .catch(() => {/* non-fatal */});
  }, []);

  // ── Fetch requests ────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ListLeavesParams = {
      page,
      limit: LIMIT,
      sortBy: 'appliedOn',
      sortOrder: 'desc',
    };
    if (statusFilter)    params.status      = statusFilter;
    if (leaveTypeFilter) params.leaveTypeId = leaveTypeFilter;

    try {
      const result = await listMyLeavesApi(params);
      setRequests(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.meta?.pages ?? 1);
      setTotal(result.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, leaveTypeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, leaveTypeFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── Cancel ────────────────────────────────────────────────────────────────
  async function handleCancel(id: string) {
    setCancellingId(id);
    setError(null);
    try {
      const updated = await cancelLeaveApi(id);
      setRequests((prev) => prev.map((r) => r._id === updated._id ? updated : r));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel request.');
    } finally {
      setCancellingId(null);
    }
  }

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = requests?.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const typeName = (r.leaveTypeId as ApiLeaveType)?.name?.toLowerCase() ?? '';
    const typeCode = (r.leaveTypeId as ApiLeaveType)?.code?.toLowerCase() ?? '';
    return typeName.includes(q) || typeCode.includes(q) || r.reason.toLowerCase().includes(q);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card">
        {/* Toolbar */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search leave type or reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | '')}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {leaveTypes.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
              ⚠ {error}
              <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchRequests}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading requests…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {requests.length === 0 ? 'No leave requests found.' : 'No results match your search.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const leaveType = r.leaveTypeId as ApiLeaveType;
                  const isCancelling = cancellingId === r._id;
                  return (
                    <tr key={r._id}>
                      {/* Leave type */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                              letterSpacing: 0.4,
                            }}>
                              {leaveType.code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td style={{ fontSize: 13 }}>
                        {formatDateRange(r.startDate, r.endDate)}
                      </td>

                      {/* Days */}
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                          {r.totalDays}
                        </span>
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
                            className="tbl-btn view"
                            onClick={() => setViewingLeave(r)}
                          >
                            View
                          </button>
                          {(r.status === 'pending' || r.status === 'approved') && (
                            <button
                              className="tbl-btn reject"
                              onClick={() => handleCancel(r._id)}
                              disabled={isCancelling}
                              style={{ opacity: isCancelling ? 0.5 : 1 }}
                            >
                              {isCancelling ? '…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer: count + pagination */}
        {!loading && !error && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {total > 0 ? (
                <>
                  Showing <b style={{ color: 'var(--text-2)' }}>{filtered.length}</b>
                  {' '}of <b style={{ color: 'var(--text-2)' }}>{total}</b> record{total !== 1 ? 's' : ''}
                </>
              ) : 'No records'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Page {page} of {Math.max(1, totalPages)}
              </span>
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

      {/* Detail modal */}
      {viewingLeave && (
        <DetailModal leave={viewingLeave} onClose={() => setViewingLeave(null)} />
      )}
    </>
  );
}
