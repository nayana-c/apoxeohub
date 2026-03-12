import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'LeaveOS — Leave Management System',
  description: 'Modern leave management portal',
};

/**
 * Root layout — wraps every page with AuthProvider.
 * The AppLayout (sidebar + topbar) is applied only to
 * protected routes via the (app) route-group layout.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
