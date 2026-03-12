'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  listLeaveTypesApi,
  deactivateLeaveTypeApi,
  activateLeaveTypeApi,
  type ApiLeaveType,
} from '@/lib/leaveTypeApi';
import { ApiError } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LeaveTypeModal from './LeaveTypeModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const accrualLabel: Record<string, string> = {
  annual:  'Annual',
  monthly: 'Monthly',
  none:    'None',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function LeaveTypesTable() {
  const { user } = useAuth();
  // Only 'admin' role can create/edit/toggle leave types per backend routes
  const canManage = user?.role === 'admin';

  // ── State ──────────────────────────────────────────────────────────────────
  const [leaveTypes, setLeaveTypes]     = useState<ApiLeaveType[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [togglingId, setTogglingId]     = useState<string | null>(null);

  // Modals
  const [showCreate, setShowCreate]     = useState(false);
  const [editingLt, setEditingLt]       = useState<ApiLeaveType | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLeaveTypesApi(showInactive);
      setLeaveTypes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load leave types.');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { fetchLeaveTypes(); }, [fetchLeaveTypes]);

  // ── Toggle active / inactive ──────────────────────────────────────────────
  async function handleToggleStatus(lt: ApiLeaveType) {
    setTogglingId(lt._id);
    try {
      const updated = lt.isActive
        ? await deactivateLeaveTypeApi(lt._id)
        : await activateLeaveTypeApi(lt._id);
      setLeaveTypes((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    } finally {
      setTogglingId(null);
    }
  }

  // ── After create ──────────────────────────────────────────────────────────
  function handleCreated(lt: ApiLeaveType) {
    setLeaveTypes((prev) => [lt, ...prev]);
    setShowCreate(false);
  }

  // ── After edit ────────────────────────────────────────────────────────────
  function handleUpdated(lt: ApiLeaveType) {
    setEditingLt(null);
    setLeaveTypes((prev) => prev.map((t) => (t._id === lt._id ? lt : t)));
  }

  // ── Visible rows (client-side inactive filter) ────────────────────────────
  const visible = showInactive ? leaveTypes : leaveTypes.filter((lt) => lt.isActive);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card">

        {/* ── Header / toolbar ── */}
        <div className="card-header">
          <div>
            <div className="card-title">Leave Types</div>
            <div className="card-sub">Configure all leave policies and their rules</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-2)',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              Show inactive
            </label>

            {canManage && (
              <button
                className="topbar-btn btn-primary"
                onClick={() => setShowCreate(true)}
              >
                + Add Type
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="table-wrap">
          {error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
              ⚠ {error}
              <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchLeaveTypes}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading leave types…
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {leaveTypes.length === 0 ? 'No leave types configured yet.' : 'No active leave types.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Days</th>
                  <th>Carry Fwd</th>
                  <th>Accrual</th>
                  <th>Notice</th>
                  <th>Max Run</th>
                  <th>Requires Doc</th>
                  <th>Applies To</th>
                  <th>Status</th>
                  {canManage && <th style={{ width: 140 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((lt) => {
                  const isToggling = togglingId === lt._id;
                  return (
                    <tr key={lt._id} style={{ opacity: lt.isActive ? 1 : 0.55 }}>

                      {/* Name + description */}
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>{lt.name}</span>
                        {lt.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, maxWidth: 180 }}>
                            {lt.description}
                          </div>
                        )}
                      </td>

                      {/* Code */}
                      <td>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          padding: '2px 8px',
                          background: 'rgba(99,102,241,0.1)',
                          color: 'var(--purple)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          borderRadius: 5,
                          letterSpacing: 0.5,
                        }}>
                          {lt.code}
                        </span>
                      </td>

                      {/* Default days */}
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{lt.defaultDays}</td>

                      {/* Carry forward max */}
                      <td style={{ fontSize: 13 }}>
                        {lt.carryForwardMax > 0
                          ? <span style={{ color: 'var(--green)' }}>{lt.carryForwardMax}d</span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>

                      {/* Accrual type */}
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {accrualLabel[lt.accrualType] ?? lt.accrualType}
                      </td>

                      {/* Min notice */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {lt.minNoticeDays > 0 ? `${lt.minNoticeDays}d` : '—'}
                      </td>

                      {/* Max consecutive */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {lt.maxConsecutive > 0 ? `${lt.maxConsecutive}d` : '—'}
                      </td>

                      {/* Requires doc */}
                      <td>
                        {lt.requiresDoc ? (
                          <span className="badge" style={{
                            background: 'rgba(16,185,129,0.1)',
                            color: 'var(--green)',
                            border: '1px solid rgba(16,185,129,0.2)',
                          }}>
                            Yes
                          </span>
                        ) : (
                          <span className="badge" style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: 'var(--red)',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}>
                            No
                          </span>
                        )}
                      </td>

                      {/* Applicable to */}
                      <td style={{ fontSize: 12 }}>
                        {lt.applicableTo.length === 0 ? (
                          <span style={{ color: 'var(--text-3)' }}>All</span>
                        ) : (
                          <span title={lt.applicableTo.map((d) => d.name).join(', ')}>
                            {lt.applicableTo[0].name}
                            {lt.applicableTo.length > 1 && (
                              <span style={{
                                marginLeft: 4,
                                fontSize: 10,
                                padding: '1px 5px',
                                background: 'var(--surface-2)',
                                borderRadius: 10,
                                color: 'var(--text-3)',
                              }}>
                                +{lt.applicableTo.length - 1}
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <Badge status={lt.isActive ? 'active' : 'inactive'} />
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="tbl-btn view"
                              onClick={() => setEditingLt(lt)}
                              disabled={isToggling}
                              title="Edit leave type"
                            >
                              Edit
                            </button>
                            <button
                              className={`tbl-btn ${lt.isActive ? 'reject' : 'approve'}`}
                              onClick={() => handleToggleStatus(lt)}
                              disabled={isToggling}
                              style={{ opacity: isToggling ? 0.5 : 1, minWidth: 74 }}
                            >
                              {isToggling ? '…' : lt.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary row */}
        {!loading && !error && leaveTypes.length > 0 && (
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-3)',
            display: 'flex',
            gap: 16,
          }}>
            <span><b style={{ color: 'var(--text-2)' }}>{leaveTypes.filter((t) => t.isActive).length}</b> active</span>
            {showInactive && (
              <span><b style={{ color: 'var(--text-2)' }}>{leaveTypes.filter((t) => !t.isActive).length}</b> inactive</span>
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && canManage && (
        <LeaveTypeModal
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}

      {/* Edit modal */}
      {editingLt && canManage && (
        <LeaveTypeModal
          leaveType={editingLt}
          onClose={() => setEditingLt(null)}
          onSaved={handleUpdated}
        />
      )}
    </>
  );
}
