'use client';

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPasswordApi } from '@/lib/authApi';
import { ApiError } from '@/lib/api';
import Link from 'next/link';

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

// ── Inner component (needs useSearchParams — must be inside Suspense) ─────────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) setTokenError('The reset link is invalid or has expired. Please request a new one.');
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setError('');
    setLoading(true);

    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 400) {
        setError('This reset link has expired or already been used. Please request a new one.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Invalid / missing token ──────────────────────────────────────────────
  if (tokenError) {
    return (
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">📋</div>
            <div className="auth-logo-text">Apoxeo<span>HUB</span></div>
          </div>
          <div style={{ fontSize: 28, marginBottom: 14 }}>🔗</div>
          <div className="auth-title">Link Invalid</div>
          <div className="auth-subtitle">{tokenError}</div>
        </div>
        <div className="auth-body">
          <Link href="/login" className="topbar-btn btn-primary auth-submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">📋</div>
            <div className="auth-logo-text">Leave<span>OS</span></div>
          </div>
          <div style={{ fontSize: 32, marginBottom: 14 }}>✅</div>
          <div className="auth-title">Password Reset!</div>
          <div className="auth-subtitle">
            Your password has been updated. You can now sign in with your new credentials.
          </div>
        </div>
        <div className="auth-body">
          <Link
            href="/login"
            className="topbar-btn btn-primary auth-submit"
            style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
          >
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">📋</div>
          <div className="auth-logo-text">Leave<span>OS</span></div>
        </div>
        <div style={{ fontSize: 28, marginBottom: 14 }}>🔑</div>
        <div className="auth-title">Create New Password</div>
        <div className="auth-subtitle">
          Choose a strong password for your account.
        </div>
      </div>

      <form className="auth-body" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="auth-alert error">
            <span className="auth-alert-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* New password */}
        <div className="form-group">
          <label className="form-label" htmlFor="pwd">New Password</label>
          <div className="input-wrap">
            <input
              id="pwd"
              className="form-input"
              type={showPwd ? 'text' : 'password'}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button type="button" className="input-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
              {showPwd ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </div>

        <p className="password-hint">
          Must be at least 8 characters with one uppercase letter and one number.
        </p>

        {/* Confirm password */}
        <div className="form-group">
          <label className="form-label" htmlFor="conf">Confirm Password</label>
          <div className="input-wrap">
            <input
              id="conf"
              className="form-input"
              type={showConf ? 'text' : 'password'}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button type="button" className="input-eye" onClick={() => setShowConf(v => !v)} tabIndex={-1}>
              {showConf ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="topbar-btn btn-primary auth-submit"
          disabled={loading || !password || !confirm}
          style={{ opacity: loading || !password || !confirm ? 0.65 : 1 }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.75s linear infinite' }} />
              Updating…
            </span>
          ) : 'Reset Password →'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 12.5, color: 'var(--text-3)', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

// ── Page wrapper (Suspense required for useSearchParams) ─────────────────────
export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={
        <div className="auth-card">
          <div className="auth-header" style={{ border: 'none' }}>
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon">📋</div>
              <div className="auth-logo-text">Leave<span>OS</span></div>
            </div>
          </div>
          <div className="auth-body" style={{ alignItems: 'center' }}>
            <div className="auth-spinner" />
          </div>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
