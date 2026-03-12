'use client';

import { useState, useEffect } from 'react';
import { listPendingApprovalsApi, type ApiLeaveRequest } from '@/lib/leaveApi';
import type { ApiLeaveType } from '@/lib/leaveTypeApi';
import { ApiError } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['default', 'green', 'amber', 'blue', 'red'] as const;
function avatarColor(id: string) {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start: string, end: string) {
  const s = formatDate(start);
  const e = formatDate(end);
  return s === e ? s : `${s} – ${e}`;
}

export default function UpcomingLeaves() {
  const [leaves,  setLeaves]  = useState<ApiLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    const today   = new Date().toISOString().split('T')[0];
    const ahead   = new Date();
    ahead.setDate(ahead.getDate() + 60);
    const aheadStr = ahead.toISOString().split('T')[0];

    setLoading(true);
    listPendingApprovalsApi({
      status: 'approved',
      startDate: today,
      endDate: aheadStr,
      sortBy: 'startDate',
      sortOrder: 'asc',
      limit: 20,
    })
      .then((res) => {
        setLeaves(Array.isArray(res.data) ? res.data : []);
        setTotal(res.meta?.total ?? 0);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load upcoming leaves.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Upcoming Approved Leaves</div>
          <div className="card-sub">
            {loading ? 'Loading…' : `${total} approved leave${total !== 1 ? 's' : ''} in the next 60 days`}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        {error ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
            ⚠ {error}
          </div>
        ) : loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Loading…
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No upcoming approved leaves in the next 60 days
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((r) => {
                const emp       = typeof r.employeeId === 'object' ? r.employeeId : null;
                const empName   = emp?.name ?? '—';
                const empId     = emp?._id  ?? String(r.employeeId);
                const leaveType = r.leaveTypeId as ApiLeaveType;

                return (
                  <tr key={r._id}>
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

                    <td style={{ fontSize: 13 }}>
                      {formatDateRange(r.startDate, r.endDate)}
                    </td>

                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                        {r.totalDays}
                      </span>
                    </td>

                    <td>
                      <Badge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
