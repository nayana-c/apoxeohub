'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateMeApi, uploadMyAvatarApi, changePasswordApi } from '@/lib/authApi';
import { ApiError } from '@/lib/api';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7001/api/v1').replace('/api/v1', '');

function toAbsUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border)', marginBottom: 0, paddingBottom: 12 }}>
        <div className="card-title" style={{ fontSize: 14 }}>{title}</div>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ── Inline field ──────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))' }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // ── Profile form state ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    dateOfBirth: formatDate(user?.dateOfBirth),
  });
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState<string | null>(null);
  const [saveErr, setSaveErr]     = useState<string | null>(null);

  // ── Avatar state ──────────────────────────────────────────────────────────
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarErr, setAvatarErr]         = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(toAbsUrl(user?.profilePicture));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Password change state ─────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState<string | null>(null);
  const [pwErr, setPwErr]       = useState<string | null>(null);
  const [showPw, setShowPw]     = useState(false);

  // Sync form when user changes (e.g. after login rehydration)
  useEffect(() => {
    if (!user) return;
    setForm({
      name:        user.name ?? '',
      phone:       user.phone ?? '',
      address:     user.address ?? '',
      dateOfBirth: formatDate(user.dateOfBirth),
    });
    setPreviewUrl(toAbsUrl(user.profilePicture));
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSaveErr(null); setSaveMsg(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setSaveErr('Name is required.'); return; }
    setSaveErr(null); setSaveMsg(null); setSaving(true);
    try {
      const updated = await updateMeApi({
        name:        form.name.trim() || undefined,
        phone:       form.phone.trim() || null,
        address:     form.address.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
      });
      updateUser(updated);
      setSaveMsg('Profile updated successfully.');
    } catch (err) {
      setSaveErr(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarErr(null); setAvatarLoading(true);
    try {
      const updated = await uploadMyAvatarApi(file);
      setPreviewUrl(toAbsUrl(updated.profilePicture));
      updateUser(updated);
    } catch (err) {
      setAvatarErr(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null); setPwMsg(null);
    if (!pwForm.current || !pwForm.newPw) { setPwErr('All fields are required.'); return; }
    if (pwForm.newPw !== pwForm.confirm)  { setPwErr('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 8)          { setPwErr('New password must be at least 8 characters.'); return; }
    setPwSaving(true);
    try {
      await changePasswordApi(pwForm.current, pwForm.newPw);
      setPwMsg('Password changed. Please log in again.');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  }

  if (!user) return null;

  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>

      {/* ── Avatar + identity card ── */}
      <Section title="Profile Picture">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={user.name}
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }}
              />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700,
              }}>
                {initials}
              </div>
            )}
            {avatarLoading && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="auth-spinner" style={{ width: 22, height: 22 }} />
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              className="topbar-btn btn-primary"
              style={{ fontSize: 12, padding: '6px 14px', marginBottom: 8 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              {avatarLoading ? 'Uploading…' : 'Upload Photo'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>JPEG, PNG or WebP · max 2 MB</div>
            {avatarErr && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>⚠ {avatarErr}</div>}
          </div>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
      </Section>

      {/* ── Read-only identity info ── */}
      <Section title="Account Information">
        <Field label="Employee ID">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-2)' }}>{user.employeeId}</span>
        </Field>
        <Field label="Email">
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{user.email}</span>
        </Field>
        <Field label="Role">
          <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{user.role}</span>
        </Field>
        <Field label="Department">
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{user.department?.name ?? '—'}</span>
        </Field>
        <Field label="Join Date">
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {new Date(user.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </Field>
      </Section>

      {/* ── Editable personal info ── */}
      <Section title="Personal Information">
        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Your full name"
                disabled={saving}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="+1 234 567 8900"
                  disabled={saving}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date of Birth</label>
                <input
                  className="form-input"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Address</label>
              <input
                className="form-input"
                name="address"
                value={form.address}
                onChange={handleFormChange}
                placeholder="123 Main St, City, State, ZIP"
                disabled={saving}
              />
            </div>

            {saveErr && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: 'var(--red)', fontSize: 12, fontWeight: 500 }}>
                ⚠ {saveErr}
              </div>
            )}
            {saveMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: 'var(--green)', fontSize: 12, fontWeight: 500 }}>
                ✓ {saveMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="topbar-btn btn-primary"
                disabled={saving}
                style={{ minWidth: 130 }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </Section>

      {/* ── Change password ── */}
      <Section title="Change Password">
        <form onSubmit={handleChangePassword}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={(e) => { setPwErr(null); setPwForm((p) => ({ ...p, current: e.target.value })); }}
                  placeholder="Enter current password"
                  disabled={pwSaving}
                  style={{ paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, padding: 0 }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.newPw}
                  onChange={(e) => { setPwErr(null); setPwForm((p) => ({ ...p, newPw: e.target.value })); }}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  disabled={pwSaving}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={(e) => { setPwErr(null); setPwForm((p) => ({ ...p, confirm: e.target.value })); }}
                  placeholder="Repeat new password"
                  disabled={pwSaving}
                  required
                />
              </div>
            </div>

            {pwErr && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: 'var(--red)', fontSize: 12, fontWeight: 500 }}>
                ⚠ {pwErr}
              </div>
            )}
            {pwMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: 'var(--green)', fontSize: 12, fontWeight: 500 }}>
                ✓ {pwMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="topbar-btn btn-primary" disabled={pwSaving} style={{ minWidth: 150 }}>
                {pwSaving ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </div>
        </form>
      </Section>

    </div>
  );
}
