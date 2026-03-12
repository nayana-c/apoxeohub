'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ModalProvider } from '@/context/ModalContext';
import { NavCountsProvider } from '@/context/NavCountsContext';
import NewLeaveModal from '@/components/shared/NewLeaveModal';
import { useAuth } from '@/context/AuthContext';
import { getRouteAllowedRoles } from '@/constants/navigation';

/**
 * Protected app route-group layout.
 *
 * Renders the full AppLayout (sidebar + topbar) only when the user is
 * authenticated.  During the initial session-rehydration pass it shows a
 * full-screen loading spinner so no layout flicker occurs.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users once loading is complete
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect first-time users to set-password
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.mustResetPassword) {
      router.replace('/set-password');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Role-based route guard — redirect to dashboard if role is not allowed
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    const allowedRoles = getRouteAllowedRoles(pathname);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="auth-spinner" />
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading…</span>
        </div>
      </div>
    );
  }

  // Don't render app shell for unauthenticated or first-login users
  // (redirect is in-flight via useEffect above)
  if (!isAuthenticated || user?.mustResetPassword) return null;

  return (
    <NavCountsProvider>
      <ModalProvider>
        <AppLayout>{children}</AppLayout>
        <NewLeaveModal />
      </ModalProvider>
    </NavCountsProvider>
  );
}
