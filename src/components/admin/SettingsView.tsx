'use client';

import { useState, useEffect } from 'react';
import Toggle from '@/components/ui/Toggle';
import { getSettingsApi, updateSettingsApi, AppSettings } from '@/lib/settingsApi';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Organization', 'Approval', 'Notifications', 'Leave Policy'] as const;
type Tab = (typeof TABS)[number];

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SETTINGS: AppSettings = {
  _id: '',
  key: 'global',
  orgName: 'My Company',
  orgTimezone: 'Asia/Kolkata',
  fiscalYearStart: 1,
  workingDays: [1, 2, 3, 4, 5],
  workingHoursPerDay: 8,
  multiLevelApproval: true,
  autoApproveSickLeave: false,
  approvalSlaHours: 48,
  notifyOnLeaveApplied: true,
  notifyOnDecision: true,
  notifyOnBalanceExpiry: true,
  carryForwardCap: 10,
  minNoticeDays: 3,
  probationLeaveRestriction: true,
  updatedAt: '',
};

// ── Small sub-components ──────────────────────────────────────────────────────

function SettingRow({
  name,
  desc,
  control,
}: {
  name: string;
  desc: string;
  control: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div>
        <div className="setting-name">{name}</div>
        <div className="setting-desc">{desc}</div>
      </div>
      {control}
    </div>
  );
}

function NumberInput({
  value,
  min = 0,
  max,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      className="form-input"
      style={{ width: 84, textAlign: 'center' }}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 160, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '100%', height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '100%', height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '80%', height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<Tab>('Organization');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    getSettingsApi()
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load settings.');
        setLoading(false);
      });
  }, []);

  // ── Patch helper ───────────────────────────────────────────────────────────
  function patch<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettingsApi(settings);
      setSettings(updated);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString());
      setTimeout(() => setSavedAt(null), 3500);
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Reset to defaults ──────────────────────────────────────────────────────
  function handleReset() {
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, _id: prev._id, key: prev.key }));
    setDirty(true);
    setError(null);
  }

  // ── Working-day toggle helper ──────────────────────────────────────────────
  function toggleWorkingDay(dayIndex: number) {
    const current = settings.workingDays;
    const next = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex].sort((a, b) => a - b);
    patch('workingDays', next);
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <div style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <SkeletonCard />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <div style={{ width: 120, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ width: 120, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          padding: 4,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font)',
              transition: 'all 0.18s',
              background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: activeTab === tab ? '#60a5fa' : 'var(--text-2)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#f87171',
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ORGANIZATION TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Organization' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Organization Profile</div>
              <div className="card-sub">Basic company information and work schedule</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 4 }}>
            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                className="form-input"
                value={settings.orgName}
                placeholder="e.g. Acme Corp"
                onChange={(e) => patch('orgName', e.target.value)}
              />
            </div>

            {/* Timezone + Fiscal Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select
                  className="form-select"
                  value={settings.orgTimezone}
                  onChange={(e) => patch('orgTimezone', e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fiscal Year Starts</label>
                <select
                  className="form-select"
                  value={settings.fiscalYearStart}
                  onChange={(e) => patch('fiscalYearStart', Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Working Days */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                Working Days
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DAYS_OF_WEEK.map((day, i) => {
                  const active = settings.workingDays.includes(i);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleWorkingDay(i)}
                      style={{
                        width: 48,
                        height: 38,
                        border: `1px solid ${active ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'var(--font)',
                        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: active ? '#60a5fa' : 'var(--text-2)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working Hours */}
            <div className="form-group" style={{ maxWidth: 220 }}>
              <label className="form-label">Working Hours per Day</label>
              <NumberInput
                value={settings.workingHoursPerDay}
                min={1}
                max={24}
                onChange={(v) => patch('workingHoursPerDay', v)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          APPROVAL TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Approval' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Approval Workflow</div>
              <div className="card-sub">Configure how leave requests are reviewed and escalated</div>
            </div>
          </div>

          <SettingRow
            name="Multi-level Approval"
            desc="Require both the direct manager and HR to approve before a request is finalised"
            control={
              <Toggle
                checked={settings.multiLevelApproval}
                onChange={(v) => patch('multiLevelApproval', v)}
              />
            }
          />
          <SettingRow
            name="Auto-approve Sick Leave"
            desc="Automatically approve sick leave requests of 2 days or fewer"
            control={
              <Toggle
                checked={settings.autoApproveSickLeave}
                onChange={(v) => patch('autoApproveSickLeave', v)}
              />
            }
          />
          <SettingRow
            name="Approval SLA (hours)"
            desc="Escalate pending requests if they are not actioned within this time"
            control={
              <NumberInput
                value={settings.approvalSlaHours}
                min={1}
                onChange={(v) => patch('approvalSlaHours', v)}
              />
            }
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          NOTIFICATIONS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Notifications' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Notifications</div>
              <div className="card-sub">Control which events trigger email alerts</div>
            </div>
          </div>

          <SettingRow
            name="Leave Applied"
            desc="Notify the manager when an employee submits a new leave request"
            control={
              <Toggle
                checked={settings.notifyOnLeaveApplied}
                onChange={(v) => patch('notifyOnLeaveApplied', v)}
              />
            }
          />
          <SettingRow
            name="Approval / Rejection"
            desc="Notify the employee when their request is approved or rejected"
            control={
              <Toggle
                checked={settings.notifyOnDecision}
                onChange={(v) => patch('notifyOnDecision', v)}
              />
            }
          />
          <SettingRow
            name="Balance Expiry Alerts"
            desc="Remind employees before unused leave lapses at year-end"
            control={
              <Toggle
                checked={settings.notifyOnBalanceExpiry}
                onChange={(v) => patch('notifyOnBalanceExpiry', v)}
              />
            }
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEAVE POLICY TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Leave Policy' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Leave Policy Defaults</div>
              <div className="card-sub">Applied automatically to all employees unless overridden per leave type</div>
            </div>
          </div>

          <SettingRow
            name="Carry Forward Cap (days)"
            desc="Maximum unused days that roll over into the next year"
            control={
              <NumberInput
                value={settings.carryForwardCap}
                min={0}
                onChange={(v) => patch('carryForwardCap', v)}
              />
            }
          />
          <SettingRow
            name="Min Notice Period (days)"
            desc="Minimum advance notice required when applying for planned leave"
            control={
              <NumberInput
                value={settings.minNoticeDays}
                min={0}
                onChange={(v) => patch('minNoticeDays', v)}
              />
            }
          />
          <SettingRow
            name="Probation Leave Restriction"
            desc="Block annual leave requests from employees still in probation"
            control={
              <Toggle
                checked={settings.probationLeaveRestriction}
                onChange={(v) => patch('probationLeaveRestriction', v)}
              />
            }
          />
        </div>
      )}

      {/* ── Action bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {savedAt && (
          <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 500 }}>
            ✓ Saved at {savedAt}
          </span>
        )}
        {dirty && !savedAt && (
          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Unsaved changes</span>
        )}
        <button
          className="topbar-btn btn-ghost"
          onClick={handleReset}
          disabled={saving}
        >
          Reset Defaults
        </button>
        <button
          className="topbar-btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 120 }}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
