'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { changePasswordApi } from '@/lib/authApi';
import { ApiError } from '@/lib/api';
import logoImg from '@/app/assets/apoxeo-hub_logo.png';

// ── Eye icon ──────────────────────────────────────────────────────────────────
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

// ── Password field helpers ────────────────────────────────────────────────────
interface PwdFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

function PwdField({ id, label, value, onChange, placeholder = '', autoComplete }: PwdFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="form-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          className="input-eye"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff /> : <EyeOpen />}
        </button>
      </div>
    </div>
  );
}

// ── Validation helper ─────────────────────────────────────────────────────────
function validate(current: string, next: string, confirm: string): string {
  if (!current) return 'Please enter your current (temporary) password.';
  if (next.length < 8) return 'New password must be at least 8 characters.';
  if (!/[A-Z]/.test(next)) return 'New password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(next)) return 'New password must contain at least one number.';
  if (next !== confirm) return 'Passwords do not match.';
  if (next === current) return 'New password must be different from your current password.';
  return '';
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SetPasswordPage() {
  const { user, clearAuth } = useAuth();

  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationError = validate(current, next, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await changePasswordApi(current, next);
      // BE clears the refresh token — log the user out client-side
      // and redirect to login with a success hint
      clearAuth();
      window.location.href = '/login?pwdReset=1';
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setError('Current password is incorrect. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <Image src={logoImg} alt="ApoxeoHUB" height={44} style={{ width: 'auto' }} priority />
          </div>

          <div style={{ fontSize: 28, marginBottom: 14 }}>🔐</div>
          <div className="auth-title">Set your password</div>
          <div className="auth-subtitle">
            {user?.name ? `Hi ${user.name.split(' ')[0]}! ` : ''}
            Your account requires a password update before you can continue.
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <form className="auth-body" onSubmit={handleSubmit} noValidate>

          {/* Informational banner */}
          <div className="auth-alert info">
            <span className="auth-alert-icon">ℹ</span>
            <span>
              Enter the temporary password provided by your HR administrator,
              then choose a strong new password.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-alert error">
              <span className="auth-alert-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <PwdField
            id="current"
            label="Current (Temporary) Password"
            value={current}
            onChange={setCurrent}
            placeholder="Your temporary password"
            autoComplete="current-password"
          />

          <PwdField
            id="new"
            label="New Password"
            value={next}
            onChange={setNext}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            autoComplete="new-password"
          />

          <p className="password-hint">
            Must be at least 8 characters with one uppercase letter and one number.
          </p>

          <PwdField
            id="confirm"
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />

          <button
            type="submit"
            className="topbar-btn btn-primary auth-submit"
            disabled={loading || !current || !next || !confirm}
            style={{ opacity: loading || !current || !next || !confirm ? 0.65 : 1 }}
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
                Updating…
              </span>
            ) : (
              'Set Password & Continue →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
