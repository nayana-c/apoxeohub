'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

// ── Eye icons ─────────────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext.login handles redirect (/ or /set-password)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.statusCode === 403 || err.message.toLowerCase().includes('inactive')) {
          setError('Your account has been deactivated. Please contact HR.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="auth-page">
        <div className="auth-card">

          {/* ── Card header ─────────────────────────────────────── */}
          <div className="auth-header">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon">📋</div>
              <div className="auth-logo-text">
                Apoxeo<span>HUB</span>
              </div>
            </div>

            <div className="auth-title">Welcome back</div>
            <div className="auth-subtitle">
              Sign in to your account to manage leaves and approvals
            </div>
          </div>

          {/* ── Card body ────────────────────────────────────────── */}
          <form className="auth-body" onSubmit={handleSubmit} noValidate>

            {/* Error banner */}
            {error && (
              <div className="auth-alert error">
                <span className="auth-alert-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Work Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="auth-forgot">
              <button type="button" onClick={() => setShowForgot(true)}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="topbar-btn btn-primary auth-submit"
              disabled={loading || !email || !password}
              style={{ opacity: loading || !email || !password ? 0.65 : 1 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.75s linear infinite',
                    }}
                  />
                  Signing in…
                </span>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>
        </div>

       
      </div>
       {/* Footer note */}
        <div className="auth-footer-note">
          Having trouble?{' '}
          <span>Contact your HR administrator</span> for assistance.
        </div>

      {/* Forgot password modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}
