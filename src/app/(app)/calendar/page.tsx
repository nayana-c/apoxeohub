'use client';

import { useState, useEffect } from 'react';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import UpcomingEvents from '@/components/calendar/UpcomingEvents';
import { listHolidaysApi } from '@/lib/holidayApi';
import { listMyLeavesApi } from '@/lib/leaveApi';
import type { ApiHoliday } from '@/lib/holidayApi';
import type { ApiLeaveRequest } from '@/lib/leaveApi';

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [holidays, setHolidays] = useState<ApiHoliday[]>([]);
  const [leaves, setLeaves] = useState<ApiLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listHolidaysApi({ year }),
      listMyLeavesApi({ startDate: `${year}-01-01`, endDate: `${year}-12-31`, limit: 200 }),
    ])
      .then(([hols, leavesRes]) => {
        if (cancelled) return;
        setHolidays(Array.isArray(hols) ? hols : []);
        setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="two-col">
      <LeaveCalendar
        year={year}
        month={month}
        holidays={holidays}
        leaves={leaves}
        loading={loading}
        onPrev={prevMonth}
        onNext={nextMonth}
      />
      <UpcomingEvents
        year={year}
        month={month}
        holidays={holidays}
        leaves={leaves}
        loading={loading}
      />
    </div>
  );
}
