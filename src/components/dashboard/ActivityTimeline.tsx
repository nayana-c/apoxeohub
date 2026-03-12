import Link from 'next/link';
import type { ApiLeaveRequest, ApiLeaveType } from '@/lib/leaveApi';

const iconConfig = {
  approved:  { bg: 'rgba(16,185,129,0.15)',  color: 'var(--green)', icon: '✓' },
  pending:   { bg: 'rgba(245,158,11,0.15)',  color: 'var(--amber)', icon: '⏳' },
  rejected:  { bg: 'rgba(239,68,68,0.15)',   color: 'var(--red)',   icon: '✕' },
  cancelled: { bg: 'rgba(107,114,128,0.15)', color: 'var(--text-3)', icon: '—' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  leaves: ApiLeaveRequest[];
  loading?: boolean;
}

export default function ActivityTimeline({ leaves, loading }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Recent Activity</div>
          <div className="card-sub">Your leave request timeline</div>
        </div>
        <Link href="/my-requests" className="card-action">View all</Link>
      </div>

      <div className="timeline">
        {loading ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Loading…
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No recent activity.
          </div>
        ) : (
          leaves.map((leave) => {
            const leaveType = leave.leaveTypeId as ApiLeaveType;
            const typeName  = leaveType?.name ?? 'Leave';
            const status    = leave.status;
            const cfg = iconConfig[status] ?? iconConfig.pending;

            const start = fmtDate(leave.startDate);
            const end   = fmtDate(leave.endDate);
            const range = start === end ? start : `${start}–${end}`;
            const subtitle = `${range} · ${leave.totalDays} day${leave.totalDays !== 1 ? 's' : ''}`;

            const label = status.charAt(0).toUpperCase() + status.slice(1);

            return (
              <div key={leave._id} className="timeline-item">
                <div className="tl-icon" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="tl-content">
                  <div className="tl-title">{typeName} {label}</div>
                  <div className="tl-sub">{subtitle}</div>
                  <div className="tl-time">{relativeTime(leave.appliedOn)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
