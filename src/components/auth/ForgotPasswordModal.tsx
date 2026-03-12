'use client';

import { useState, type FormEvent } from 'react';
import { forgotPasswordApi } from '@/lib/authApi';

interface Props {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPasswordApi(email);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Reset Password</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              We'll send a link to your registered email
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Success state */}
          {sent ? (
            <div className="auth-alert success">
              <span className="auth-alert-icon">✓</span>
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Check your inbox</strong>
                If <strong>{email}</strong> is registered, you'll receive a password reset link
                shortly. The link expires in 1 hour.
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="auth-alert error">
                  <span className="auth-alert-icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div
                className="auth-alert info"
                style={{ marginBottom: -2 }}
              >
                <span className="auth-alert-icon">ℹ</span>
                <span>Enter your work email. If the account exists, we'll email you a secure reset link.</span>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="topbar-btn btn-primary auth-submit"
                  disabled={loading || !email}
                  style={{ opacity: loading || !email ? 0.6 : 1 }}
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
                      Sending…
                    </span>
                  ) : (
                    'Send Reset Link →'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          {sent && (
            <button
              onClick={onClose}
              className="topbar-btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
