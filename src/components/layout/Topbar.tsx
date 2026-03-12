'use client';

import { usePathname } from 'next/navigation';
import { pageMetadata } from '@/constants/navigation';
import { useModal } from '@/context/ModalContext';
import { useAuth } from '@/context/AuthContext';
import { useNavCounts } from '@/context/NavCountsContext';

export default function Topbar() {
  const pathname = usePathname();
  const { openNewLeaveModal } = useModal();
  const { user } = useAuth();

  const { pendingTeamCount, pendingMyCount } = useNavCounts();

  const meta = pageMetadata[pathname] ?? { title: 'LeaveOS', subtitle: '' };

  // Dynamic subtitle based on pathname and live counts
  let subtitle = meta.subtitle ?? '';
  if (pathname === '/' && user) {
    subtitle = `Welcome back, ${user.name.split(' ')[0]}. Here's what's happening today.`;
  } else if (pathname === '/approvals') {
    subtitle = pendingTeamCount === 1
      ? '1 request waiting for your decision.'
      : `${pendingTeamCount} requests waiting for your decision.`;
  } else if (pathname === '/my-requests') {
    subtitle = pendingMyCount === 1
      ? 'You have 1 pending leave request.'
      : pendingMyCount > 0
        ? `You have ${pendingMyCount} pending leave requests.`
        : 'All your leave requests are up to date.';
  }

  return (
    <header className="topbar">
      <div>
        <div className="page-title">{meta.title}</div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {/* <div className="topbar-right">
        <button className="notif-btn" title="Notifications">
          🔔
          <div className="notif-dot" />
        </button>
        <button className="topbar-btn btn-ghost">Export ↓</button>
        <button className="topbar-btn btn-primary" onClick={openNewLeaveModal}>
          + New Request
        </button>
      </div> */}
    </header>
  );
}
