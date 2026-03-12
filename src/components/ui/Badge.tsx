import { LeaveStatus } from '@/types';

interface BadgeProps {
  status: LeaveStatus | 'active' | 'inactive' | 'holiday';
  label?: string;
  style?: React.CSSProperties;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
  holiday: 'Holiday',
};

const statusClasses: Record<string, string> = {
  pending: 'badge pending',
  approved: 'badge approved',
  rejected: 'badge rejected',
  cancelled: 'badge cancelled',
  active: 'badge approved',
  inactive: 'badge cancelled',
  holiday: 'badge',
};

export default function Badge({ status, label, style }: BadgeProps) {
  const baseStyle =
    status === 'holiday'
      ? { background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)', ...style }
      : style;

  return (
    <span className={statusClasses[status]} style={baseStyle}>
      {label ?? statusLabels[status]}
    </span>
  );
}
