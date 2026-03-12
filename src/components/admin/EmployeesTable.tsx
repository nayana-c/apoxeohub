'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { listEmployeesApi } from '@/lib/employeeApi';
import { ApiError } from '@/lib/api';
import type { ApiEmployee } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import CreateEmployeeModal from './CreateEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import EmployeeBalancesModal from './EmployeeBalancesModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const AVATAR_COLORS = ['default', 'green', 'amber', 'blue', 'red'] as const;
function avatarColor(id: string) {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const roleBadgeStyle: Record<string, React.CSSProperties> = {
  employee: { background: 'rgba(59,130,246,0.1)',  color: '#60A5FA',       border: '1px solid rgba(59,130,246,0.2)' },
  manager:  { background: 'rgba(16,185,129,0.1)',  color: 'var(--green)',  border: '1px solid rgba(16,185,129,0.2)' },
  hr:       { background: 'rgba(139,92,246,0.1)',  color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' },
  admin:    { background: 'rgba(245,158,11,0.1)',  color: 'var(--amber)',  border: '1px solid rgba(245,158,11,0.2)' },
};

const roleLabel: Record<string, string> = {
  employee: 'Employee',
  manager:  'Manager',
  hr:       'HR',
  admin:    'Admin',
};

const PAGE_SIZE = 15;

// ── Component ─────────────────────────────────────────────────────────────────
export default function EmployeesTable() {
  const { user } = useAuth();
  const canManage = user?.role === 'hr' || user?.role === 'admin';

  // ── State ──────────────────────────────────────────────────────────────────
  const [employees, setEmployees]         = useState<ApiEmployee[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showModal, setShowModal]                   = useState(false);
  const [editingEmployee, setEditingEmployee]         = useState<ApiEmployee | null>(null);
  const [balancesEmployee, setBalancesEmployee]       = useState<ApiEmployee | null>(null);

  // Filters
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  // Debounce search input
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [roleFilter, statusFilter]);

  // ── Fetch employees ────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listEmployeesApi({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role:   roleFilter   !== 'all' ? roleFilter   : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setEmployees(res.data);
      setTotalPages(res.meta.pages);
      setTotal(res.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── After an employee is updated / status toggled ─────────────────────────
  function handleUpdated(updated: ApiEmployee) {
    setEditingEmployee(null);
    setEmployees((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
  }

  // ── After a new employee is created ───────────────────────────────────────
  function handleCreated() {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
    fetchEmployees();
    
  }

  // useEffect will fire fetchEmployees once state settles above
  useEffect(() => {
    if (!loading && page === 1 && debouncedSearch === '' && roleFilter === 'all' && statusFilter === 'all') {
      fetchEmployees();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card">
        {/* ── Search / Filter bar ── */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search name, email or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Add button — HR / Admin only */}
          {canManage && (
            <button
              className="topbar-btn btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowModal(true)}
            >
              + Add Employee
            </button>
          )}
        </div>

        {/* ── Table body ── */}
        <div className="table-wrap">
          {error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
              ⚠ {error}
              <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchEmployees}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading employees…
            </div>
          ) : employees.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No employees found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  {canManage && <th style={{ width: 80 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    {/* Name + avatar */}
                    <td>
                      <div className="td-name">
                        <Avatar initials={getInitials(emp.name)} color={avatarColor(emp._id)} size="sm" />
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    {/* Employee ID */}
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                        {emp.employeeId}
                      </span>
                    </td>
                    {/* Email */}
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{emp.email}</td>
                    {/* Department */}
                    <td>
                      {emp.department
                        ? emp.department.name
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    {/* Role badge */}
                    <td>
                      <span className="badge" style={roleBadgeStyle[emp.role]}>
                        {roleLabel[emp.role]}
                      </span>
                    </td>
                    {/* Join date */}
                    <td>{formatDate(emp.joinDate)}</td>
                    {/* Status badge */}
                    <td>
                      <Badge status={emp.status === 'active' ? 'active' : 'inactive'} />
                    </td>
                    {/* Actions */}
                    {canManage && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="tbl-btn view"
                            onClick={() => setEditingEmployee(emp)}
                            title="Edit employee"
                          >
                            Edit
                          </button>
                          <button
                            className="tbl-btn view"
                            onClick={() => setBalancesEmployee(emp)}
                            title="View leave balances"
                          >
                            Balances
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && !error && total > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-3)',
          }}>
            <span>
              Showing{' '}
              <b style={{ color: 'var(--text-2)' }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
              </b>
              {' '}of <b style={{ color: 'var(--text-2)' }}>{total}</b> employees
            </span>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="tbl-btn view"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                style={{ opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
              >
                ← Prev
              </button>

              {/* Smart page pills with ellipsis */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '…' ? (
                    <span key={`ell-${idx}`} style={{ padding: '5px 2px', color: 'var(--text-3)' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      className="tbl-btn view"
                      onClick={() => setPage(p as number)}
                      style={{
                        minWidth: 30,
                        background: page === p ? 'var(--accent)' : undefined,
                        color:      page === p ? 'white'         : undefined,
                        border:     page === p ? 'none'          : undefined,
                      }}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                className="tbl-btn view"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                style={{ opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'default' : 'pointer' }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Employee Modal — HR / Admin only */}
      {showModal && canManage && (
        <CreateEmployeeModal
          onClose={() => setShowModal(false)}
          onCreated={() => { handleCreated(); setShowModal(false); }}
        />
      )}

      {/* Edit Employee Modal — HR / Admin only */}
      {editingEmployee && canManage && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Employee Balances Modal — HR / Admin only */}
      {balancesEmployee && canManage && (
        <EmployeeBalancesModal
          employee={balancesEmployee}
          onClose={() => setBalancesEmployee(null)}
        />
      )}
    </>
  );
}
