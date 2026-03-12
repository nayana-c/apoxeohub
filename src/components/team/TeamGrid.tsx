'use client';

import { useState, useEffect } from 'react';
import { listPendingApprovalsApi, type ApiLeaveRequest } from '@/lib/leaveApi';
import { listEmployeesApi } from '@/lib/employeeApi';
import { ApiError } from '@/lib/api';
import type { ApiEmployee } from '@/types';
import StatCard from '@/components/ui/StatCard';
import TeamMemberCard from './TeamMemberCard';

// ── Helper ────────────────────────────────────────────────────────────────────

function isOnLeaveToday(employeeId: string, leaves: ApiLeaveRequest[]): ApiLeaveRequest | null {
  if (!Array.isArray(leaves) || leaves.length === 0) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0); // midday avoids timezone edge cases
  for (const leave of leaves) {
    const empId = typeof leave.employeeId === 'object'
      ? leave.employeeId._id
      : String(leave.employeeId);
    if (empId !== employeeId) continue;
    const start = new Date(leave.startDate); start.setHours(0,  0,  0,  0);
    const end   = new Date(leave.endDate);   end.setHours(23, 59, 59, 999);
    if (today >= start && today <= end) return leave;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TeamGrid() {
  const [employees,    setEmployees]    = useState<ApiEmployee[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<ApiLeaveRequest[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const today        = new Date();
      const todayStr     = today.toISOString().split('T')[0];
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0];

      // Window to detect active leaves: 1 month back → 1 month ahead
      const winStart = new Date(today); winStart.setMonth(today.getMonth() - 1);
      const winEnd   = new Date(today); winEnd.setMonth(today.getMonth() + 1);

      try {
        const [empRes, leavesRes, pendingRes, monthRes] = await Promise.all([
          // All active team members
          listEmployeesApi({ status: 'active', limit: 100, sortBy: 'name', sortOrder: 'asc' }),
          // Approved leaves in a 2-month window (to detect who's on leave today)
          listPendingApprovalsApi({
            status: 'approved',
            startDate: winStart.toISOString().split('T')[0],
            endDate:   winEnd.toISOString().split('T')[0],
            limit: 200,
          }),
          // Pending count only
          listPendingApprovalsApi({ status: 'pending', limit: 1 }),
          // Approved this month count only
          listPendingApprovalsApi({ status: 'approved', startDate: firstOfMonth, endDate: todayStr, limit: 1 }),
        ]);

        setEmployees(Array.isArray(empRes.data)     ? empRes.data     : []);
        setActiveLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
        setPendingTotal(pendingRes.meta?.total ?? 0);
        setMonthlyTotal(monthRes.meta?.total  ?? 0);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load team data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const onLeaveTodayCount = employees.filter(
    (emp) => isOnLeaveToday(emp._id, activeLeaves) !== null
  ).length;

  const inOfficeCount = employees.length - onLeaveTodayCount;

  const stats = [
    {
      color: 'blue'   as const,
      icon: '',
      label: 'Team Members',
      value: employees.length,
      sub: 'Active employees',
    },
    {
      color: 'amber'  as const,
      icon: '',
      label: 'On Leave Today',
      value: onLeaveTodayCount,
      sub: 'in office',
      subBold: `${inOfficeCount} members`,
    },
    {
      color: 'purple' as const,
      icon: '',
      label: 'Pending Approvals',
      value: pendingTotal,
      sub: 'Awaiting action',
    },
    {
      color: 'green'  as const,
      icon: '',
      label: 'Approved This Month',
      value: monthlyTotal,
      sub: 'Leave requests',
    },
  ];

  return (
    <>
      {/* Stats row */}
      <div className="stats-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Team grid */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Team Overview</div>
            <div className="card-sub">
              {loading
                ? 'Loading…'
                : `Current leave status of ${employees.length} team members`}
            </div>
          </div>
        </div>

        {error ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
            ⚠ {error}
          </div>
        ) : loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Loading team data…
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No team members found.
          </div>
        ) : (
          <div className="team-grid">
            {employees.map((emp) => (
              <TeamMemberCard
                key={emp._id}
                employee={emp}
                activeLeave={isOnLeaveToday(emp._id, activeLeaves)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
