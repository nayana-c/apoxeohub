import type { ApiEmployee } from '@/types';
import type { ApiLeaveRequest } from '@/lib/leaveApi';
import type { ApiLeaveType } from '@/lib/leaveTypeApi';
import Avatar from '@/components/ui/Avatar';

const AVATAR_COLORS = ['default', 'green', 'amber', 'blue', 'red'] as const;
function avatarColor(id: string) {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  employee: ApiEmployee;
  activeLeave: ApiLeaveRequest | null;
}

export default function TeamMemberCard({ employee, activeLeave }: Props) {
  const isOnLeave = activeLeave !== null;

  let leaveInfo = 'In Office';
  if (activeLeave) {
    const leaveType = activeLeave.leaveTypeId as ApiLeaveType;
    const typeName  = leaveType?.name ?? 'Leave';
    const start     = formatDateShort(activeLeave.startDate);
    const end       = formatDateShort(activeLeave.endDate);
    leaveInfo = `On ${typeName} · ${start === end ? start : `${start} – ${end}`}`;
  }

  return (
    <div className="team-card">
      <div className="team-card-top">
        <Avatar initials={getInitials(employee.name)} color={avatarColor(employee._id)} />
        <div>
          <div className="team-card-name">{employee.name}</div>
          <div className="team-card-role">
            {employee.department?.name ?? employee.role}
          </div>
        </div>
      </div>
      <div className={`team-status ${isOnLeave ? 'status-leave' : 'status-in'}`}>
        {leaveInfo}
      </div>
    </div>
  );
}
