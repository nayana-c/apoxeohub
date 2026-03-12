export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// ── Backend-aligned employee type (from /employees API) ──────────────────────
export interface ApiEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  department?: { _id: string; name: string; code: string } | null;
  managerId?: { _id: string; name: string; employeeId: string } | string | null;
  joinDate: string;
  status: 'active' | 'inactive';
  mustResetPassword: boolean;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  profilePicture?: string | null;
  createdAt: string;
  updatedAt: string;
}
export type LeaveTypeName = 'annual' | 'sick' | 'casual' | 'maternity' | 'comp-off' | 'unpaid';
export type AvatarColor = 'default' | 'green' | 'amber' | 'blue' | 'red';
export type StatColor = 'blue' | 'green' | 'amber' | 'purple' | 'red';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  department: string;
  role: 'Employee' | 'Manager' | 'Admin';
  jobTitle: string;
  manager: string;
  joinDate: string;
  status: 'active' | 'inactive';
  avatarColor: AvatarColor;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  avatarColor: AvatarColor;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  appliedOn: string;
  approver: string;
  approverInitials: string;
  approverAvatarColor: AvatarColor;
  status: LeaveStatus;
  reason: string;
}

export interface LeaveBalance {
  name: string;
  leaveType: LeaveTypeName;
  remaining: number;
  total: number;
  percentage: number;
  gradient: string;
  textColor: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'approved' | 'pending' | 'rejected';
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  jobTitle: string;
  avatarColor: AvatarColor;
  status: 'in-office' | 'on-leave';
  leaveInfo?: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  defaultDays: number | string;
  accrual: string;
  carryForward: string;
  requiresDoc: boolean;
  isActive: boolean;
}

export interface BarChartItem {
  label: string;
  displayValue: string | number;
  percentage: number;
  gradient: string;
}

export interface UpcomingEvent {
  id: string;
  day: number;
  month: string;
  title: string;
  subtitle: string;
  status: LeaveStatus | 'holiday';
  color: 'accent' | 'amber' | 'green';
}

export interface StatCardData {
  color: StatColor;
  icon: string;
  label: string;
  value: string | number;
  sub: string;
  subBold?: string;
}
