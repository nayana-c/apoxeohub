import type { UserRole } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface NavSection {
  label: string;
  /** Minimum role required to see this section */
  roles: UserRole[];
  items: NavItem[];
}

export const navigationSections: NavSection[] = [
  {
    label: 'Overview',
    roles: ['employee', 'manager', 'hr', 'admin'],
    items: [
      { label: 'Dashboard',      href: '/',            icon: '⬡' },
      { label: 'Apply for Leave', href: '/apply-leave', icon: '✦' },
      { label: 'My Requests',    href: '/my-requests', icon: '◷' },
      { label: 'Calendar',       href: '/calendar',    icon: '⬛' },
    ],
  },
  {
    label: 'Manager',
    roles: ['manager', 'hr', 'admin'],
    items: [
      { label: 'Approvals',  href: '/approvals', icon: '◈', badge: 4 },
      { label: 'Team View',  href: '/team',      icon: '◎' },
    ],
  },
  {
    label: 'Admin',
    roles: ['hr', 'admin'],
    items: [
      { label: 'Leave Types',  href: '/admin/leave-types',   icon: '⬡' },
      { label: 'Employees',    href: '/admin/employees',     icon: '◈' },
      { label: 'Departments',  href: '/admin/departments',   icon: '◫' },
      { label: 'Holidays',     href: '/admin/holidays',      icon: '◷' },
      { label: 'Reports',      href: '/admin/reports',       icon: '▦' },
      { label: 'Settings',     href: '/admin/settings',      icon: '⚙' },
    ],
  },
];

export const pageMetadata: Record<string, { title: string; subtitle: string | null }> = {
  '/':                    { title: 'Dashboard',          subtitle: null /* dynamic — uses user name */ },
  '/profile':             { title: 'My Profile',         subtitle: 'View and update your personal information.' },
  '/apply-leave':         { title: 'Apply for Leave',    subtitle: 'Submit a new leave request for manager approval.' },
  '/my-requests':         { title: 'My Requests',        subtitle: 'View and manage all your leave requests.' },
  '/calendar':            { title: 'Leave Calendar',     subtitle: 'Your personal leave and company holidays.' },
  '/approvals':           { title: 'Pending Approvals',  subtitle: '4 requests waiting for your decision.' },
  '/team':                { title: 'Team View',          subtitle: 'Monitor team availability and leave status.' },
  '/admin/leave-types':   { title: 'Leave Types',        subtitle: 'Admin CMS · Configure and manage leave type policies.' },
  '/admin/employees':     { title: 'Employee Directory', subtitle: 'Admin CMS · Manage employee profiles and roles.' },
  '/admin/departments':   { title: 'Departments',        subtitle: 'Admin CMS · Manage organisational departments.' },
  '/admin/holidays':      { title: 'Holidays',           subtitle: 'Admin CMS · Manage public, company, and optional holidays.' },
  '/admin/reports':       { title: 'Reports & Analytics', subtitle: 'Leave utilization, trends, and department summaries.' },
  '/admin/settings':      { title: 'System Settings',   subtitle: 'Configure approval workflows, notifications, and policies.' },
};

/** Map a role string to a human-readable label */
export const roleLabelMap: Record<UserRole, string> = {
  employee: 'Employee',
  manager:  'Manager',
  hr:       'HR',
  admin:    'Admin',
};

/**
 * Returns the allowed roles for a given pathname by looking it up in
 * navigationSections.  Returns null if the path has no restriction.
 */
export function getRouteAllowedRoles(pathname: string): UserRole[] | null {
  for (const section of navigationSections) {
    for (const item of section.items) {
      const matches =
        item.href === '/'
          ? pathname === '/'
          : pathname === item.href || pathname.startsWith(item.href + '/');
      if (matches) return [...section.roles];
    }
  }
  return null;
}
