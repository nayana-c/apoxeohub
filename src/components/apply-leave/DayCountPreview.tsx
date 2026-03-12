interface DayCountPreviewProps {
  workingDays: number;
  balanceAfter: number;
  conflicts: number;
}

export default function DayCountPreview({
  workingDays,
  balanceAfter,
  conflicts,
}: DayCountPreviewProps) {
  const divider = (
    <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
  );

  const metric = (label: string, value: number, color: string) => (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace" }}>
        {value}
      </div>
    </div>
  );

  return (
    <div
      style={{
        margin: '0 20px 16px',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.18)',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        gap: 24,
        alignItems: 'center',
      }}
    >
      {metric('Working Days', workingDays, 'var(--accent)')}
      {divider}
      {metric('Balance After', balanceAfter, 'var(--green)')}
      {divider}
      {metric('Conflicts', conflicts, conflicts > 0 ? 'var(--red)' : 'var(--green)')}
    </div>
  );
}
