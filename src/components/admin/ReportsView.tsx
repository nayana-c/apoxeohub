import StatCard from '@/components/ui/StatCard';
import BarChart from '@/components/ui/BarChart';
import { StatCardData, BarChartItem } from '@/types';

interface ReportsViewProps {
  stats: StatCardData[];
  byTypeChart: BarChartItem[];
  byDeptChart: BarChartItem[];
}

export default function ReportsView({ stats, byTypeChart, byDeptChart }: ReportsViewProps) {
  return (
    <>
      <div className="stats-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Leave by Type</div>
              <div className="card-sub">March 2026 distribution</div>
            </div>
          </div>
          <BarChart items={byTypeChart} />
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Departments</div>
              <div className="card-sub">Leave utilization by team</div>
            </div>
          </div>
          <BarChart items={byDeptChart} />
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
            }}
          >
            <button className="topbar-btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
              Export CSV ↓
            </button>
            <button className="topbar-btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
              Export PDF ↓
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
