'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { navigationSections, roleLabelMap } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNavCounts } from '@/context/NavCountsContext';
import type { UserRole } from '@/types/auth';
import logoImg from '@/app/assets/apoxeo-hub_logo.png';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns up to two uppercase initials from a full name */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Determines which nav sections to show based on role */
function visibleSections(role: UserRole | undefined) {
  if (!role) return [];
  return navigationSections.filter((s) => s.roles.includes(role));
}

// ── Logout icon ───────────────────────────────────────────────────────────────
function LogoutIcon() {
  return (
    <svg
      width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { pendingTeamCount, pendingMyCount } = useNavCounts();

  const sections = visibleSections(user?.role);

  function dynamicBadge(href: string, staticBadge?: number): number | undefined {
    if (href === '/approvals') return pendingTeamCount > 0 ? pendingTeamCount : undefined;
    if (href === '/my-requests') return pendingMyCount > 0 ? pendingMyCount : undefined;
    return staticBadge;
  }
  const initials = user ? getInitials(user.name) : '…';
  const roleLabel = user ? roleLabelMap[user.role] : '';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        <Image src={logoImg} alt="ApoxeoHUB" height={24} style={{ width: 'auto' }} priority />
      </div>

      {/* Navigation */}  
      {sections.map((section) => (
        <div key={section.label} className="nav-section">
          <div className="nav-label">{section.label}</div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {dynamicBadge(item.href, item.badge) !== undefined && (
                <span className="nav-badge">{dynamicBadge(item.href, item.badge)}</span>
              )}
            </Link>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {/* User card + logout */}
      <div className="sidebar-user">
        <Link href="/profile" style={{ display: 'contents' }}>
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name ?? '…'}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </Link>
        <button
          className="sidebar-logout"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}
