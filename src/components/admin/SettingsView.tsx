'use client';

import Toggle from '@/components/ui/Toggle';

interface SettingRowProps {
  name: string;
  desc: string;
  control: React.ReactNode;
}

function SettingRow({ name, desc, control }: SettingRowProps) {
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

function InputControl({ defaultValue }: { defaultValue: string }) {
  return (
    <input
      className="form-input"
      style={{ width: 80, textAlign: 'center' }}
      defaultValue={defaultValue}
    />
  );
}

export default function SettingsView() {
  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Approval Workflow</div>
            <div className="card-sub">Configure how leave requests are approved</div>
          </div>
        </div>
        <SettingRow
          name="Multi-level Approval"
          desc="Require both direct manager and HR to approve"
          control={<Toggle defaultChecked />}
        />
        <SettingRow
          name="Auto-approve Sick Leave"
          desc="Automatically approve sick leave up to 2 days"
          control={<Toggle />}
        />
        <SettingRow
          name="Approval SLA (hours)"
          desc="Escalate if not approved within"
          control={<InputControl defaultValue="48" />}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Notifications</div>
            <div className="card-sub">Control what triggers email and in-app alerts</div>
          </div>
        </div>
        <SettingRow
          name="Leave Applied"
          desc="Notify manager when a new leave is submitted"
          control={<Toggle defaultChecked />}
        />
        <SettingRow
          name="Approval / Rejection"
          desc="Notify employee of decision"
          control={<Toggle defaultChecked />}
        />
        <SettingRow
          name="Balance Expiry Alerts"
          desc="Remind employees before year-end lapse"
          control={<Toggle defaultChecked />}
        />
        <SettingRow
          name="Slack Integration"
          desc="Send leave notifications to Slack channels"
          control={<Toggle />}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Leave Policy Defaults</div>
            <div className="card-sub">Apply to new employees automatically</div>
          </div>
        </div>
        <SettingRow
          name="Carry Forward Cap"
          desc="Maximum days that roll over to next year"
          control={<InputControl defaultValue="10" />}
        />
        <SettingRow
          name="Min Notice Period (days)"
          desc="Minimum advance notice required for annual leave"
          control={<InputControl defaultValue="3" />}
        />
        <SettingRow
          name="Probation Leave Restriction"
          desc="Block annual leave during probation period"
          control={<Toggle defaultChecked />}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="topbar-btn btn-ghost">Reset Defaults</button>
        <button className="topbar-btn btn-primary">Save Settings</button>
      </div>
    </div>
  );
}
