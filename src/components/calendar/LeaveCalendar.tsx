import type { ApiHoliday } from '@/lib/holidayApi';
import type { ApiLeaveRequest, ApiLeaveType } from '@/lib/leaveApi';

type DayType =
  | 'normal'
  | 'other-month'
  | 'today'
  | 'holiday'
  | 'on-leave'
  | 'leave-start'
  | 'leave-range'
  | 'leave-end';

interface CalDay {
  date: number;
  type: DayType;
  hasEvent?: boolean;
}

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface Props {
  year: number;
  month: number; // 0-indexed
  holidays: ApiHoliday[];
  leaves: ApiLeaveRequest[];
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function LeaveCalendar({ year, month, holidays, leaves, loading, onPrev, onNext }: Props) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Build a set of holiday dates for fast lookup
  const holidayDates = new Set(holidays.map(h => h.date.slice(0, 10)));

  // Only show approved/pending leaves; approved takes priority
  const relevantLeaves = leaves
    .filter(l => l.status === 'approved' || l.status === 'pending')
    .sort((a, b) => (a.status === 'approved' ? -1 : b.status === 'approved' ? 1 : 0));

  function getLeaveType(dateStr: string): DayType | null {
    for (const leave of relevantLeaves) {
      const start = leave.startDate.slice(0, 10);
      const end = leave.endDate.slice(0, 10);
      if (dateStr < start || dateStr > end) continue;
      if (start === end) return 'on-leave';
      if (dateStr === start) return 'leave-start';
      if (dateStr === end) return 'leave-end';
      return 'leave-range';
    }
    return null;
  }

  // Build calendar days
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: CalDay[] = [];

  // Previous-month overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: prevMonthDays - i, type: 'other-month' });
  }

  // Current-month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(year, month, d);
    const isToday = dateStr === todayStr;
    const isHoliday = holidayDates.has(dateStr);
    const leaveType = getLeaveType(dateStr);

    let type: DayType;
    let hasEvent = false;

    if (leaveType) {
      type = leaveType;
      hasEvent = isToday; // show dot when today is also on leave
    } else if (isHoliday) {
      type = 'holiday';
      hasEvent = isToday;
    } else if (isToday) {
      type = 'today';
      hasEvent = true;
    } else {
      type = 'normal';
    }

    days.push({ date: d, type, hasEvent });
  }

  // Next-month overflow to fill the grid (complete last row)
  const totalCells = Math.ceil(days.length / 7) * 7;
  for (let d = 1; days.length < totalCells; d++) {
    days.push({ date: d, type: 'other-month' });
  }

  const prevMonthName = MONTH_NAMES[month === 0 ? 11 : month - 1].slice(0, 3);
  const nextMonthName = MONTH_NAMES[month === 11 ? 0 : month + 1].slice(0, 3);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{MONTH_NAMES[month]} {year}</div>
          <div className="card-sub">Personal + company calendar</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <button className="tbl-btn view" onClick={onPrev} disabled={loading}>
            ← {prevMonthName}
          </button>
          <button className="tbl-btn view" onClick={onNext} disabled={loading}>
            {nextMonthName} →
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {DAY_HEADERS.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {days.map((day, idx) => (
          <div key={idx} className={`cal-day ${day.type}`}>
            {day.date}
            {day.hasEvent && <div className="cal-dot" />}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {[
          { bg: 'rgba(59,130,246,0.2)', label: 'Your Leave' },
          { bg: 'rgba(16,185,129,0.12)', label: 'Approved' },
          { bg: 'rgba(245,158,11,0.12)', label: 'Holiday' },
        ].map(({ bg, label }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: bg }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
