import Badge from '@/components/ui/Badge';
import type { ApiHoliday } from '@/lib/holidayApi';
import type { ApiLeaveRequest, ApiLeaveType } from '@/lib/leaveApi';
import type { LeaveStatus } from '@/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

interface DerivedEvent {
  id: string;
  day: number;
  monthShort: string;
  title: string;
  subtitle: string;
  status: LeaveStatus | 'holiday';
  color: 'accent' | 'amber' | 'green';
}

const colorMap = {
  accent: { bg: 'rgba(59,130,246,0.12)', text: 'var(--accent)' },
  amber:  { bg: 'rgba(245,158,11,0.12)',  text: 'var(--amber)' },
  green:  { bg: 'rgba(16,185,129,0.12)',  text: 'var(--green)' },
};

interface Props {
  year: number;
  month: number; // 0-indexed
  holidays: ApiHoliday[];
  leaves: ApiLeaveRequest[];
  loading: boolean;
}

export default function UpcomingEvents({ year, month, holidays, leaves, loading }: Props) {
  const monthName = MONTH_NAMES[month];
  const monthStr = String(month + 1).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const events: DerivedEvent[] = [];

  // Holidays in this month
  for (const h of holidays) {
    const d = h.date.slice(0, 10);
    if (d < monthStart || d > monthEnd) continue;
    const day = parseInt(d.slice(8), 10);
    const subtitle =
      h.type === 'public' ? 'Public Holiday' :
      h.type === 'company' ? 'Company Holiday' : 'Optional Holiday';
    events.push({
      id: `holiday-${h._id}`,
      day,
      monthShort: MONTH_SHORT[month],
      title: h.name,
      subtitle,
      status: 'holiday',
      color: 'amber',
    });
  }

  // Leaves that start in this month (approved or pending)
  for (const leave of leaves) {
    if (leave.status !== 'approved' && leave.status !== 'pending') continue;
    const start = leave.startDate.slice(0, 10);
    if (start < monthStart || start > monthEnd) continue;

    const day = parseInt(start.slice(8), 10);
    const leaveType = leave.leaveTypeId as ApiLeaveType;
    const typeName = leaveType?.name ?? 'Leave';
    const subtitle = leave.totalDays === 1
      ? '1 day'
      : `${leave.totalDays} days`;

    events.push({
      id: `leave-${leave._id}`,
      day,
      monthShort: MONTH_SHORT[month],
      title: typeName,
      subtitle,
      status: leave.status,
      color: leave.status === 'approved' ? 'green' : 'accent',
    });
  }

  // Sort by day
  events.sort((a, b) => a.day - b.day);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Upcoming in {monthName}</div>
          <div className="card-sub">Holidays, leaves &amp; events</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
            Loading…
          </div>
        ) : events.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
            No events this month
          </div>
        ) : (
          events.map((event, idx) => {
            const c = colorMap[event.color];
            return (
              <div key={event.id}>
                {idx > 0 && (
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
                )}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 42, height: 42,
                      borderRadius: 10,
                      background: c.bg,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: c.text, lineHeight: 1 }}>
                      {event.day}
                    </div>
                    <div style={{ fontSize: 9, color: c.text, fontWeight: 600 }}>
                      {event.monthShort}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {event.subtitle}
                    </div>
                  </div>
                  <Badge status={event.status} style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
