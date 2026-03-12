import type { ApiLeaveBalance } from '@/lib/leaveApi';
import Link from 'next/link';

const PALETTE = [
  { gradient: 'linear-gradient(90deg,#3B82F6,#60A5FA)', textColor: '#60A5FA' },
  { gradient: 'linear-gradient(90deg,#059669,#10B981)', textColor: '#34D399' },
  { gradient: 'linear-gradient(90deg,#0891B2,#06B6D4)', textColor: '#22D3EE' },
  { gradient: 'linear-gradient(90deg,#7C3AED,#8B5CF6)', textColor: '#C084FC' },
  { gradient: 'linear-gradient(90deg,#EC4899,#F472B6)', textColor: '#F472B6' },
  { gradient: 'linear-gradient(90deg,#F59E0B,#FCD34D)', textColor: '#FCD34D' },
];

const CODE_COLORS: Record<string, (typeof PALETTE)[0]> = {
  AL: PALETTE[0], SL: PALETTE[1], CL: PALETTE[2], ML: PALETTE[4], CO: PALETTE[3],
};

interface Props {
  balances: ApiLeaveBalance[];
  loading?: boolean;
  year?: number;
}

export default function LeaveBalanceCard({ balances, loading, year }: Props) {
  const displayYear = year ?? new Date().getFullYear();

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Leave Balance Overview</div>
          <div className="card-sub">
            FY {displayYear}–{String(displayYear + 1).slice(2)} · Updated today
          </div>
        </div>
        <Link href="/apply-leave" className="card-action">+ Request</Link>
      </div>

      <div className="balance-list">
        {loading ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Loading…
          </div>
        ) : balances.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No leave balances for this year.
          </div>
        ) : (
          balances.map((b, idx) => {
            const type   = b.leaveTypeId;
            const total  = b.remaining + b.used;
            const pct    = total > 0 ? Math.round((b.remaining / total) * 100) : 0;
            const colors = CODE_COLORS[type?.code?.toUpperCase()] ?? PALETTE[idx % PALETTE.length];
            return (
              <div key={b._id}>
                <div className="balance-top">
                  <span className="balance-name">{type?.name ?? 'Leave'}</span>
                  <span className="balance-count" style={{ color: colors.textColor }}>
                    {b.remaining} / {total}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: colors.gradient }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
