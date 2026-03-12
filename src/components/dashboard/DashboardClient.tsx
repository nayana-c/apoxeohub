'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/ui/StatCard';
import LeaveBalanceCard from './LeaveBalanceCard';
import ActivityTimeline from './ActivityTimeline';
import AnnouncementBanner from './AnnouncementBanner';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import {
  getMyBalancesApi,
  listMyLeavesApi,
  listPendingApprovalsApi,
  approveLeaveApi,
  type ApiLeaveBalance,
  type ApiLeaveRequest,
  type ApiLeaveType,
} from '@/lib/leaveApi';
import { listEmployeesApi } from '@/lib/employeeApi';
import { listHolidaysApi, type ApiHoliday } from '@/lib/holidayApi';
import type { UserRole } from '@/types/auth';
import type { StatCardData } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

const AVATAR_COLORS = ['default', 'green', 'amber', 'blue', 'red'] as const;
function avatarColor(id: string) {
  const code = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

// ── Quick approvals mini-list (manager / hr / admin) ─────────────────────────

function QuickApprovals({ leaves, onApproved }: { leaves: ApiLeaveRequest[]; onApproved: (id: string) => void }) {
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  async function handleApprove(id: string) {
    setApprovingIds((s) => new Set(s).add(id));
    try {
      await approveLeaveApi(id);
      onApproved(id);
    } catch {
      // silently ignore — user can go to full approvals page
    } finally {
      setApprovingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  if (leaves.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Pending Approvals</div>
          <div className="card-sub">Quick actions · Showing first {leaves.length}</div>
        </div>
        <Link href="/approvals" className="card-action">View all →</Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Days</th>
              <th>Applied</th>
              <th style={{ width: 110 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((r) => {
              const emp       = typeof r.employeeId === 'object' ? r.employeeId : null;
              const empName   = emp?.name ?? '—';
              const empId     = emp?._id ?? String(r.employeeId);
              const leaveType = r.leaveTypeId as ApiLeaveType;
              const start     = fmtDateShort(r.startDate);
              const end       = fmtDateShort(r.endDate);
              const range     = start === end ? start : `${start} – ${end}`;
              const isApproving = approvingIds.has(r._id);
              return (
                <tr key={r._id}>
                  <td>
                    <div className="td-name">
                      <Avatar initials={getInitials(empName)} color={avatarColor(empId)} size="sm" />
                      <span>{empName}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                    {leaveType?.name ?? '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{range}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.totalDays}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDate(r.appliedOn)}</td>
                  <td>
                    <button
                      className="tbl-btn approve"
                      onClick={() => handleApprove(r._id)}
                      disabled={isApproving}
                      style={{ opacity: isApproving ? 0.5 : 1 }}
                    >
                      {isApproving ? '…' : '✓ Approve'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Upcoming approved leaves mini-list (all roles) ────────────────────────────

function UpcomingMyLeaves({ leaves }: { leaves: ApiLeaveRequest[] }) {
  const upcoming = leaves
    .filter((l) => l.status === 'approved' && new Date(l.startDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Your Upcoming Leaves</div>
          <div className="card-sub">Approved leaves starting from today</div>
        </div>
        <Link href="/my-requests" className="card-action">View all →</Link>
      </div>
      <div style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {upcoming.map((leave) => {
          const leaveType = leave.leaveTypeId as ApiLeaveType;
          const start     = fmtDateShort(leave.startDate);
          const end       = fmtDateShort(leave.endDate);
          const range     = start === end ? start : `${start} – ${end}`;
          const diff      = daysUntil(leave.startDate);
          const when      = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`;
          return (
            <div key={leave._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>
                  {leaveType?.name ?? 'Leave'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {range} · {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: diff <= 3 ? 'var(--amber)' : 'var(--text-3)',
                  background: diff <= 3 ? 'rgba(245,158,11,0.1)' : 'var(--bg-3)',
                  border: `1px solid ${diff <= 3 ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                  borderRadius: 5, padding: '2px 8px',
                }}>{when}</span>
                <Badge status={leave.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  balances:           ApiLeaveBalance[];
  recentLeaves:       ApiLeaveRequest[];
  allMyLeaves:        ApiLeaveRequest[];   // for upcoming section
  pendingMyCount:     number;
  nextHoliday:        ApiHoliday | null;
  // manager / hr / admin
  pendingTeamLeaves:  ApiLeaveRequest[];
  pendingTeamCount:   number;
  onLeaveTodayCount:  number;
  approvedMonthCount: number;
  // hr / admin only
  totalEmployees:     number;
}

export default function DashboardClient() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      const today        = new Date().toISOString().split('T')[0];
      const year         = new Date().getFullYear();
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      // 60-day lookahead for upcoming leaves
      const ahead60 = new Date(); ahead60.setDate(ahead60.getDate() + 60);
      const ahead60Str = ahead60.toISOString().split('T')[0];

      try {
        // ── Common (all roles) ────────────────────────────────────────────────
        const [bals, recentRes, myPendingRes, holidaysRes, allLeavesRes] = await Promise.all([
          getMyBalancesApi(year),
          listMyLeavesApi({ limit: 6, sortBy: 'appliedOn', sortOrder: 'desc' }),
          listMyLeavesApi({ status: 'pending', limit: 1 }),
          listHolidaysApi({ year }),
          listMyLeavesApi({ startDate: today, endDate: ahead60Str, limit: 10, sortBy: 'startDate', sortOrder: 'asc' }),
        ]);

        const now = new Date();
        const nextHoliday = (Array.isArray(holidaysRes) ? holidaysRes : [])
          .filter((h) => new Date(h.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

        const base: DashboardData = {
          balances:           Array.isArray(bals) ? bals : [],
          recentLeaves:       Array.isArray(recentRes.data) ? recentRes.data : [],
          allMyLeaves:        Array.isArray(allLeavesRes.data) ? allLeavesRes.data : [],
          pendingMyCount:     myPendingRes.meta?.total ?? 0,
          nextHoliday,
          pendingTeamLeaves:  [],
          pendingTeamCount:   0,
          onLeaveTodayCount:  0,
          approvedMonthCount: 0,
          totalEmployees:     0,
        };

        // ── Manager / HR / Admin extras ───────────────────────────────────────
        if (role === 'manager' || role === 'hr' || role === 'admin') {
          const [teamPendingRes, onLeaveRes, monthRes] = await Promise.all([
            listPendingApprovalsApi({ status: 'pending', limit: 5, sortBy: 'appliedOn', sortOrder: 'asc' }),
            listPendingApprovalsApi({ status: 'approved', startDate: today, endDate: today, limit: 1 }),
            listPendingApprovalsApi({ status: 'approved', startDate: firstOfMonth, endDate: today, limit: 1 }),
          ]);
          base.pendingTeamLeaves  = Array.isArray(teamPendingRes.data) ? teamPendingRes.data : [];
          base.pendingTeamCount   = teamPendingRes.meta?.total ?? 0;
          base.onLeaveTodayCount  = onLeaveRes.meta?.total ?? 0;
          base.approvedMonthCount = monthRes.meta?.total ?? 0;
        }

        // ── HR / Admin extras ─────────────────────────────────────────────────
        if (role === 'hr' || role === 'admin') {
          const empRes = await listEmployeesApi({ status: 'active', limit: 1 });
          base.totalEmployees = empRes.meta?.total ?? 0;
        }

        setData(base);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ── Remove an approved item from the quick list after approval ───────────────
  function handleApproved(id: string) {
    setData((prev) => prev
      ? { ...prev, pendingTeamLeaves: prev.pendingTeamLeaves.filter((r) => r._id !== id), pendingTeamCount: Math.max(0, prev.pendingTeamCount - 1) }
      : prev
    );
  }

  // ── Derive stats ──────────────────────────────────────────────────────────────
  const stats: StatCardData[] = (() => {
    if (!data) return [];

    const totalUsed      = data.balances.reduce((s, b) => s + b.used, 0);
    const totalRemaining = data.balances.reduce((s, b) => s + b.remaining, 0);

    if (role === 'hr' || role === 'admin') {
      return [
        { color: 'blue',   icon: '', label: 'Total Employees',       value: data.totalEmployees,     sub: 'Active employees' },
        { color: 'amber',  icon: '', label: 'On Leave Today',         value: data.onLeaveTodayCount,  sub: 'Currently on approved leave' },
        { color: 'red',    icon: '', label: 'Pending Approvals',      value: data.pendingTeamCount,   sub: 'Awaiting action' },
        { color: 'green',  icon: '', label: 'Approved This Month',    value: data.approvedMonthCount, sub: 'Leave requests' },
      ];
    }

    if (role === 'manager') {
      return [
        { color: 'amber',  icon: '', label: 'Team Pending Approvals', value: data.pendingTeamCount,   sub: 'Awaiting your action' },
        { color: 'red',    icon: '', label: 'On Leave Today',          value: data.onLeaveTodayCount,  sub: 'Team members' },
        { color: 'blue',   icon: '', label: 'My Pending Requests',     value: data.pendingMyCount,     sub: 'Awaiting manager approval' },
        { color: 'green',  icon: '', label: 'Approved This Month',     value: data.approvedMonthCount, sub: 'Team leave requests' },
      ];
    }

    // employee
    return [
      { color: 'amber',  icon: '', label: 'Pending Requests',   value: data.pendingMyCount, sub: 'Awaiting approval' },
      { color: 'blue',   icon: '', label: 'Days Taken',          value: totalUsed,           sub: 'This year' },
      { color: 'green',  icon: '', label: 'Days Available',      value: totalRemaining,      sub: 'Across all leave types' },
      {
        color: 'purple' as const,
        icon: '',
        label: 'Next Holiday',
        value: data.nextHoliday
          ? `${daysUntil(data.nextHoliday.date) === 0 ? 'Today' : `${daysUntil(data.nextHoliday.date)}d`}`
          : '—',
        sub: data.nextHoliday?.name ?? 'No upcoming holidays',
      },
    ];
  })();

  // ── Banner: next upcoming holiday ─────────────────────────────────────────────
  const holidayBanner = data?.nextHoliday && daysUntil(data.nextHoliday.date) <= 14
    ? { title: 'Upcoming Holiday', body: `${data.nextHoliday.name} on ${fmtDate(data.nextHoliday.date)}` }
    : null;

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
        Loading dashboard…
      </div>
    );
  }

  const isPrivileged = role === 'manager' || role === 'hr' || role === 'admin';

  return (
    <>
      {/* Holiday banner */}
      {holidayBanner && <AnnouncementBanner title={holidayBanner.title} body={holidayBanner.body} />}

      {/* Stats row */}
      <div className="stats-grid">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Balance + Recent Activity */}
      <div className="two-col">
        <LeaveBalanceCard balances={data?.balances ?? []} year={new Date().getFullYear()} />
        <ActivityTimeline leaves={data?.recentLeaves ?? []} />
      </div>

      {/* Upcoming approved leaves (all roles) */}
      {data && <UpcomingMyLeaves leaves={data.allMyLeaves} />}

      {/* Quick pending approvals (manager / hr / admin) */}
      {isPrivileged && data && data.pendingTeamLeaves.length > 0 && (
        <QuickApprovals leaves={data.pendingTeamLeaves} onApproved={handleApproved} />
      )}
    </>
  );
}
