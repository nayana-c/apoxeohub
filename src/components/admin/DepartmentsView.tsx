'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { listDepartmentsApi, type ApiDepartment } from '@/lib/departmentApi';
import { ApiError } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import DepartmentModal from './DepartmentModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DepartmentsView() {
  const { user } = useAuth();
  const canManage = user?.role === 'hr' || user?.role === 'admin';

  // ── State ──────────────────────────────────────────────────────────────────
  const [departments, setDepartments]         = useState<ApiDepartment[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [showInactive, setShowInactive]       = useState(false);
  const [search, setSearch]                   = useState('');

  // Modals
  const [showCreate, setShowCreate]           = useState(false);
  const [editingDept, setEditingDept]         = useState<ApiDepartment | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDepartmentsApi(showInactive);
      setDepartments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  // ── After create ──────────────────────────────────────────────────────────
  function handleCreated(dept: ApiDepartment) {
    setDepartments((prev) => [dept, ...prev]);
    setShowCreate(false);
  }

  // ── After edit ────────────────────────────────────────────────────────────
  function handleUpdated(dept: ApiDepartment) {
    setEditingDept(null);
    setDepartments((prev) => prev.map((d) => (d._id === dept._id ? dept : d)));
  }

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = departments.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.location ?? '').toLowerCase().includes(q) ||
      (d.headId?.name ?? '').toLowerCase().includes(q)
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card">
        {/* ── Toolbar ── */}
        <div className="search-bar">
          {/* Search */}
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search name, code or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Show inactive toggle */}
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

          {/* Add button — HR / Admin only */}
          {canManage && (
            <button
              className="topbar-btn btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowCreate(true)}
            >
              + Add Department
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="table-wrap">
          {error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
              ⚠ {error}
              <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchDepartments}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading departments…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {departments.length === 0 ? 'No departments yet.' : 'No departments match your search.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Code</th>
                  <th>Head</th>
                  <th>Parent</th>
                  <th>Location</th>
                  <th>Created</th>
                  <th>Status</th>
                  {canManage && <th style={{ width: 80 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((dept) => (
                  <tr key={dept._id} style={{ opacity: dept.isActive ? 1 : 0.55 }}>
                    {/* Name */}
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                        {dept.name}
                      </span>
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
                        {dept.code}
                      </span>
                    </td>

                    {/* Head */}
                    <td style={{ fontSize: 13 }}>
                      {dept.headId
                        ? <span>{dept.headId.name}</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>

                    {/* Parent */}
                    <td style={{ fontSize: 13 }}>
                      {dept.parentId
                        ? <span>{dept.parentId.name}</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>

                    {/* Location */}
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {dept.location || <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>

                    {/* Created */}
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {formatDate(dept.createdAt)}
                    </td>

                    {/* Status */}
                    <td>
                      <Badge status={dept.isActive ? 'active' : 'inactive'} />
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td>
                        <button
                          className="tbl-btn view"
                          onClick={() => setEditingDept(dept)}
                          title="Edit department"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary row */}
        {!loading && !error && departments.length > 0 && (
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-3)',
            display: 'flex',
            gap: 16,
          }}>
            <span>
              <b style={{ color: 'var(--text-2)' }}>{departments.filter((d) => d.isActive).length}</b> active
            </span>
            {showInactive && (
              <span>
                <b style={{ color: 'var(--text-2)' }}>{departments.filter((d) => !d.isActive).length}</b> inactive
              </span>
            )}
            <span>
              <b style={{ color: 'var(--text-2)' }}>{filtered.length}</b> showing
            </span>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && canManage && (
        <DepartmentModal
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}

      {/* Edit modal */}
      {editingDept && canManage && (
        <DepartmentModal
          department={editingDept}
          onClose={() => setEditingDept(null)}
          onSaved={handleUpdated}
        />
      )}
    </>
  );
}
