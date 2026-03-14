'use client';

import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/ui/StatCard';
import BarChart from '@/components/ui/BarChart';
import { listDepartmentsApi, type ApiDepartment } from '@/lib/departmentApi';
import {
  getSummaryStatsApi,
  getLeavesByTypeApi,
  getLeavesByDepartmentApi,
  getMonthlyTrendApi,
  exportCsvApi,
  type SummaryStats,
  type LeaveByType,
  type LeaveByDepartment,
  type MonthlyTrend,
  type ReportParams,
} from '@/lib/reportsApi';
import type { StatCardData, BarChartItem } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TYPE_GRADIENTS = [
  'linear-gradient(90deg,#3B82F6,#60A5FA)',
  'linear-gradient(90deg,#EF4444,#F87171)',
  'linear-gradient(90deg,#06B6D4,#22D3EE)',
  'linear-gradient(90deg,#8B5CF6,#A78BFA)',
  'linear-gradient(90deg,#F59E0B,#FCD34D)',
  'linear-gradient(90deg,#10B981,#34D399)',
  'linear-gradient(90deg,#EC4899,#F9A8D4)',
];

const DEPT_GRADIENTS = [
  'linear-gradient(90deg,#3B82F6,#60A5FA)',
  'linear-gradient(90deg,#8B5CF6,#A78BFA)',
  'linear-gradient(90deg,#10B981,#34D399)',
  'linear-gradient(90deg,#F59E0B,#FCD34D)',
  'linear-gradient(90deg,#EF4444,#F87171)',
  'linear-gradient(90deg,#06B6D4,#22D3EE)',
  'linear-gradient(90deg,#EC4899,#F9A8D4)',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }
function today()        { return toDateStr(new Date()); }
function firstOfMonth() { const d = new Date(); return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1)); }
function currentYear()  { return new Date().getFullYear(); }

function toBarItems(items: Array<{ label: string; count: number }>, gradients: string[]): BarChartItem[] {
  const max = Math.max(...items.map((i) => i.count), 1);
  return items.map((item, idx) => ({
    label:        item.label,
    displayValue: item.count,
    percentage:   Math.round((item.count / max) * 100),
    gradient:     gradients[idx % gradients.length],
  }));
}

function SkeletonBars({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 8, background: 'var(--border)', borderRadius: 4, opacity: 0.4, width: `${65 + (i % 3) * 12}%` }} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportsView() {
  // Filters
  const [from,         setFrom]         = useState(firstOfMonth());
  const [to,           setTo]           = useState(today());
  const [departmentId, setDepartmentId] = useState('');
  const [status,       setStatus]       = useState('all');
  const [year,         setYear]         = useState(currentYear());

  // Data
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [summary,     setSummary]     = useState<SummaryStats | null>(null);
  const [byType,      setByType]      = useState<LeaveByType[]>([]);
  const [byDept,      setByDept]      = useState<LeaveByDepartment[]>([]);
  const [trend,       setTrend]       = useState<MonthlyTrend[]>([]);

  // UI
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Load departments once
  useEffect(() => {
    listDepartmentsApi().then(setDepartments).catch(() => {});
  }, []);

  // Fetch all report data when filters change
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ReportParams = {
      from,
      to,
      departmentId: departmentId || undefined,
      status:       status !== 'all' ? status : undefined,
      year,
    };
    try {
      const [summaryData, typeData, deptData, trendData] = await Promise.all([
        getSummaryStatsApi(params),
        getLeavesByTypeApi(params),
        getLeavesByDepartmentApi(params),
        getMonthlyTrendApi({ departmentId: params.departmentId, year }),
      ]);
      setSummary(summaryData);
      setByType(typeData);
      setByDept(deptData);
      setTrend(trendData);
    } catch {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [from, to, departmentId, status, year]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // CSV export
  async function handleExportCsv() {
    setExporting(true);
    try {
      const blob = await exportCsvApi({
        from,
        to,
        departmentId: departmentId || undefined,
        status:       status !== 'all' ? status : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `leaves-${from}-to-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('CSV export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  // Derived stat cards
  const approvalRate = summary && summary.total > 0
    ? Math.round((summary.approved / summary.total) * 100) : 0;

  const statCards: StatCardData[] = summary ? [
    { color: 'blue',   icon: '📋', label: 'Total Requests',  value: summary.total,            sub: `${summary.pending} pending` },
    { color: 'green',  icon: '✅', label: 'Approved',         value: summary.approved,         sub: `${summary.totalApprovedDays} days taken` },
    { color: 'amber',  icon: '⏳', label: 'Pending',         value: summary.pending,           sub: `${summary.rejected} rejected` },
    { color: 'purple', icon: '📊', label: 'Approval Rate',   value: `${approvalRate}%`,        sub: `${summary.cancelled} cancelled` },
  ] : [];

  // Derived chart items
  const byTypeItems = toBarItems(byType.map((t) => ({ label: t.leaveTypeName, count: t.count })), TYPE_GRADIENTS);
  const byDeptItems = toBarItems(byDept.map((d) => ({ label: d.departmentName, count: d.count })), DEPT_GRADIENTS);

  const maxTrend   = Math.max(...trend.map((t) => t.count), 1);
  const trendItems: BarChartItem[] = trend.map((t) => ({
    label:        MONTH_NAMES[t.month - 1],
    displayValue: t.count,
    percentage:   Math.round((t.count / maxTrend) * 100),
    gradient:     'linear-gradient(90deg,#3B82F6,#60A5FA)',
  }));

  const yearOptions  = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i);
  const periodLabel  = `${from} — ${to}`;
  const STAT_COLORS  = ['blue', 'green', 'amber', 'purple'] as const;

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.3px' }}>FROM</label>
            <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.3px' }}>TO</label>
            <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.3px' }}>DEPARTMENT</label>
            <select className="form-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.3px' }}>STATUS</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }}>
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.3px' }}>TREND YEAR</label>
            <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: '6px 10px', fontSize: 13 }}>
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button
            className="topbar-btn btn-ghost"
            onClick={handleExportCsv}
            disabled={exporting || loading}
            style={{ fontSize: 12, padding: '7px 14px', marginLeft: 'auto' }}
          >
            {exporting ? 'Exporting…' : 'Export CSV ↓'}
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8, color: 'var(--red)', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠ {error}</span>
          <button onClick={fetchReports} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {loading
          ? STAT_COLORS.map((c) => (
              <div key={c} className={`stat-card ${c}`} style={{ minHeight: 110 }}>
                <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, width: '60%', marginBottom: 14, opacity: 0.4 }} />
                <div style={{ height: 32, background: 'var(--border)', borderRadius: 4, width: '35%', marginBottom: 10, opacity: 0.4 }} />
                <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, width: '70%', opacity: 0.4 }} />
              </div>
            ))
          : statCards.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* ── Leave by Type + Leave by Department ─────────────────────────────── */}
      <div className="two-col" style={{ marginBottom: 20 }}>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Leave by Type</div>
              <div className="card-sub">{periodLabel}</div>
            </div>
          </div>
          {loading ? <SkeletonBars /> : byTypeItems.length === 0
            ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No data for selected period</div>
            : <BarChart items={byTypeItems} />
          }
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Leave by Department</div>
              <div className="card-sub">{periodLabel}</div>
            </div>
          </div>
          {loading ? <SkeletonBars /> : byDeptItems.length === 0
            ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No data for selected period</div>
            : <BarChart items={byDeptItems} />
          }
        </div>

      </div>

      {/* ── Monthly Trend ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Monthly Trend — {year}</div>
            <div className="card-sub">Leave requests per month across all types</div>
          </div>
        </div>
        {loading ? <SkeletonBars rows={5} /> : trendItems.every((t) => t.displayValue === 0)
          ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No leave data for {year}</div>
          : <BarChart items={trendItems} />
        }
      </div>
    </>
  );
}
