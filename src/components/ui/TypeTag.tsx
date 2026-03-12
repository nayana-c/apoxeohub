import { LeaveTypeName } from '@/types';

interface TypeTagProps {
  type: LeaveTypeName;
}

const typeLabels: Record<LeaveTypeName, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  maternity: 'Maternity',
  'comp-off': 'Comp Off',
  unpaid: 'Unpaid',
};

const typeClasses: Record<LeaveTypeName, string> = {
  annual: 'type-tag type-annual',
  sick: 'type-tag type-sick',
  casual: 'type-tag type-casual',
  maternity: 'type-tag type-maternity',
  'comp-off': 'type-tag type-comp-off',
  unpaid: 'type-tag type-unpaid',
};

export default function TypeTag({ type }: TypeTagProps) {
  return <span className={typeClasses[type]}>{typeLabels[type]}</span>;
}
