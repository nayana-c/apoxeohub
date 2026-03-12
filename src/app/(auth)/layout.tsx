import type { ReactNode } from 'react';

/**
 * Auth route-group layout.
 * No sidebar, no topbar — just the raw page (full-screen, centred).
 * globals.css (imported in the root layout) covers background & font.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
