'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/api';
import { loginApi, logoutApi, getMeApi } from '@/lib/authApi';
import type { AuthUser } from '@/types/auth';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  updateUser: (u: AuthUser) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  clearAuth: () => {},
  updateUser: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  // ── Clear auth state (client-side only, no API call) ───────────────────────
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // ── Session rehydration on mount ───────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function rehydrate() {
      try {
        // Try to get a fresh access token via the httpOnly refresh cookie
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });

        if (!refreshRes.ok) {
          // No valid session — stay on whatever page (middleware handles redirect)
          setIsLoading(false);
          return;
        }

        const refreshJson = await refreshRes.json();
        const token: string | null = refreshJson?.data?.accessToken ?? null;

        if (!token) {
          setIsLoading(false);
          return;
        }

        setAccessToken(token);

        // Fetch full user profile with the new token
        const me = await getMeApi();
        setUser(me);

        // If first-login flag is set, push to the set-password page
        if (me.mustResetPassword) {
          router.replace('/set-password');
        }
      } catch {
        // Refresh failed — clear any stale state
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    rehydrate();
  }, [router]);

  // ── Listen for session-expired events from api.ts ─────────────────────────
  useEffect(() => {
    function onSessionExpired() {
      clearAuth();
      router.replace('/login');
    }
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, [clearAuth, router]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginApi(email, password);
      setAccessToken(data.accessToken);
      setUser(data.user);

      if (data.mustResetPassword) {
        router.replace('/set-password');
      } else {
        router.replace('/');
      }
    },
    [router]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore API errors on logout — clear state regardless
    } finally {
      clearAuth();
      router.replace('/login');
    }
  }, [clearAuth, router]);

  // ── Update user after profile changes ─────────────────────────────────────
  const updateUser = useCallback((u: AuthUser) => setUser(u), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        clearAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
