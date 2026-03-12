import type {
  LeaveRequest,
  LeaveBalance,
  ActivityItem,
  TeamMember,
  Employee,
  LeaveTypeConfig,
  BarChartItem,
  UpcomingEvent,
  StatCardData,
} from '@/types';

export const dashboardStats: StatCardData[] = [
  { color: 'blue', icon: '📅', label: 'Annual Leave Remaining', value: 12, sub: 'of 30 days', subBold: '18 used' },
  { color: 'green', icon: '🏥', label: 'Sick Leave Remaining', value: 8, sub: 'of 12 days', subBold: '4 used' },
  { color: 'amber', icon: '⏳', label: 'Pending Requests', value: 2, sub: 'Awaiting manager approval' },
  { color: 'purple', icon: '📊', label: 'Team on Leave Today', value: 3, sub: 'of 14 team members' },
];

export const leaveBalances: LeaveBalance[] = [
  { name: 'Annual Leave', leaveType: 'annual', remaining: 12, total: 30, percentage: 40, gradient: 'linear-gradient(90deg,#3B82F6,#60A5FA)', textColor: '#60A5FA' },
  { name: 'Sick Leave', leaveType: 'sick', remaining: 8, total: 12, percentage: 67, gradient: 'linear-gradient(90deg,#059669,#10B981)', textColor: '#34D399' },
  { name: 'Casual Leave', leaveType: 'casual', remaining: 2, total: 6, percentage: 33, gradient: 'linear-gradient(90deg,#0891B2,#06B6D4)', textColor: '#22D3EE' },
  { name: 'Comp Off', leaveType: 'comp-off', remaining: 1, total: 2, percentage: 50, gradient: 'linear-gradient(90deg,#7C3AED,#8B5CF6)', textColor: '#C084FC' },
];

export const recentActivity: ActivityItem[] = [
  { id: '1', title: 'Annual Leave Approved', subtitle: 'Mar 20–22 · 3 days · Approved by Priya S.', time: '2 days ago', type: 'approved' },
  { id: '2', title: 'Casual Leave Pending', subtitle: 'Mar 28 · 1 day · Waiting for approval', time: 'Today, 9:42 AM', type: 'pending' },
  { id: '3', title: 'Sick Leave Rejected', subtitle: 'Feb 14–15 · 2 days · Insufficient notice', time: 'Feb 12', type: 'rejected' },
  { id: '4', title: 'Annual Leave Approved', subtitle: 'Jan 26 · 1 day · Republic Day extension', time: 'Jan 20', type: 'approved' },
];

export const myRequests: LeaveRequest[] = [
  { id: '1', employeeId: 'EMP-004', employeeName: 'Ravi Kumar', employeeInitials: 'RK', avatarColor: 'default', leaveType: 'annual', startDate: 'Mar 20, 2026', endDate: 'Mar 22, 2026', days: 3, appliedOn: 'Mar 05, 2026', approver: 'Priya S.', approverInitials: 'PS', approverAvatarColor: 'blue', status: 'approved', reason: 'Vacation' },
  { id: '2', employeeId: 'EMP-004', employeeName: 'Ravi Kumar', employeeInitials: 'RK', avatarColor: 'default', leaveType: 'casual', startDate: 'Mar 28, 2026', endDate: 'Mar 28, 2026', days: 1, appliedOn: 'Mar 05, 2026', approver: 'Priya S.', approverInitials: 'PS', approverAvatarColor: 'blue', status: 'pending', reason: 'Personal errand' },
  { id: '3', employeeId: 'EMP-004', employeeName: 'Ravi Kumar', employeeInitials: 'RK', avatarColor: 'default', leaveType: 'sick', startDate: 'Feb 14, 2026', endDate: 'Feb 15, 2026', days: 2, appliedOn: 'Feb 12, 2026', approver: 'Priya S.', approverInitials: 'PS', approverAvatarColor: 'blue', status: 'rejected', reason: 'Viral fever' },
  { id: '4', employeeId: 'EMP-004', employeeName: 'Ravi Kumar', employeeInitials: 'RK', avatarColor: 'default', leaveType: 'annual', startDate: 'Jan 26, 2026', endDate: 'Jan 26, 2026', days: 1, appliedOn: 'Jan 20, 2026', approver: 'Priya S.', approverInitials: 'PS', approverAvatarColor: 'blue', status: 'approved', reason: 'Republic Day extension' },
  { id: '5', employeeId: 'EMP-004', employeeName: 'Ravi Kumar', employeeInitials: 'RK', avatarColor: 'default', leaveType: 'casual', startDate: 'Dec 24, 2025', endDate: 'Dec 25, 2025', days: 2, appliedOn: 'Dec 18, 2025', approver: 'Mohan K.', approverInitials: 'MK', approverAvatarColor: 'amber', status: 'approved', reason: 'Christmas break' },
];

export const pendingApprovals: LeaveRequest[] = [
  { id: 'a1', employeeId: 'EMP-001', employeeName: 'Ananya Kumar', employeeInitials: 'AK', avatarColor: 'green', leaveType: 'sick', startDate: 'Mar 6, 2026', endDate: 'Mar 7, 2026', days: 2, appliedOn: 'Mar 5', approver: 'Ravi K.', approverInitials: 'RK', approverAvatarColor: 'default', status: 'pending', reason: "Viral fever, doctor's note attached" },
  { id: 'a2', employeeId: 'EMP-002', employeeName: 'Vijay Rao', employeeInitials: 'VR', avatarColor: 'amber', leaveType: 'annual', startDate: 'Mar 10, 2026', endDate: 'Mar 14, 2026', days: 4, appliedOn: 'Mar 4', approver: 'Ravi K.', approverInitials: 'RK', approverAvatarColor: 'default', status: 'pending', reason: 'Family function out of town' },
  { id: 'a3', employeeId: 'EMP-003', employeeName: 'Sneha Menon', employeeInitials: 'SM', avatarColor: 'red', leaveType: 'casual', startDate: 'Mar 8, 2026', endDate: 'Mar 8, 2026', days: 1, appliedOn: 'Mar 5', approver: 'Ravi K.', approverInitials: 'RK', approverAvatarColor: 'default', status: 'pending', reason: 'Personal errand' },
  { id: 'a4', employeeId: 'EMP-005', employeeName: 'Nitin Patil', employeeInitials: 'NP', avatarColor: 'default', leaveType: 'maternity', startDate: 'Apr 1, 2026', endDate: 'Jun 29, 2026', days: 90, appliedOn: 'Mar 3', approver: 'Ravi K.', approverInitials: 'RK', approverAvatarColor: 'default', status: 'pending', reason: 'Maternity leave — expected delivery April' },
];

export const teamMembers: TeamMember[] = [
  { id: 'EMP-001', name: 'Ananya Kumar', initials: 'AK', jobTitle: 'Frontend Dev', avatarColor: 'green', status: 'on-leave', leaveInfo: 'On Sick Leave · Mar 6–7' },
  { id: 'EMP-002', name: 'Vijay Rao', initials: 'VR', jobTitle: 'Backend Dev', avatarColor: 'blue', status: 'in-office' },
  { id: 'EMP-003', name: 'Sneha Menon', initials: 'SM', jobTitle: 'Designer', avatarColor: 'red', status: 'in-office' },
  { id: 'EMP-005', name: 'Nitin Patil', initials: 'NP', jobTitle: 'QA Engineer', avatarColor: 'amber', status: 'on-leave', leaveInfo: 'Annual Leave · Mar 3–5' },
  { id: 'EMP-006', name: 'Deepa Pillai', initials: 'DP', jobTitle: 'DevOps', avatarColor: 'default', status: 'in-office' },
  { id: 'EMP-007', name: 'Rahul Sharma', initials: 'RS', jobTitle: 'PM', avatarColor: 'green', status: 'on-leave', leaveInfo: 'Annual Leave · Mar 5' },
];

export const teamStats: StatCardData[] = [
  { color: 'blue', icon: '', label: 'Team Members', value: 14, sub: 'Across 3 departments' },
  { color: 'amber', icon: '', label: 'On Leave Today', value: 3, sub: 'available', subBold: '11 members' },
  { color: 'purple', icon: '', label: 'Pending Approvals', value: 4, sub: 'Oldest: 2 days ago' },
  { color: 'green', icon: '', label: 'Approved This Month', value: 9, sub: 'total', subBold: '34 days' },
];

export const leaveTypeConfigs: LeaveTypeConfig[] = [
  { id: '1', name: 'Annual Leave', code: 'AL', defaultDays: 30, accrual: 'Annual', carryForward: '10 days', requiresDoc: false, isActive: true },
  { id: '2', name: 'Sick Leave', code: 'SL', defaultDays: 12, accrual: 'Monthly', carryForward: 'None', requiresDoc: true, isActive: true },
  { id: '3', name: 'Casual Leave', code: 'CL', defaultDays: 6, accrual: 'Annual', carryForward: 'None', requiresDoc: false, isActive: true },
  { id: '4', name: 'Maternity Leave', code: 'ML', defaultDays: 180, accrual: 'None', carryForward: 'None', requiresDoc: true, isActive: true },
  { id: '5', name: 'Unpaid Leave', code: 'UL', defaultDays: '—', accrual: 'None', carryForward: 'None', requiresDoc: false, isActive: false },
];

export const employees: Employee[] = [
  { id: 'EMP-001', name: 'Ananya Kumar', initials: 'AK', department: 'Engineering', role: 'Employee', jobTitle: 'Frontend Dev', manager: 'Priya S.', joinDate: 'Jan 15, 2023', status: 'active', avatarColor: 'green' },
  { id: 'EMP-002', name: 'Vijay Rao', initials: 'VR', department: 'Engineering', role: 'Manager', jobTitle: 'Backend Dev', manager: 'Ravi K.', joinDate: 'Mar 2, 2021', status: 'active', avatarColor: 'blue' },
  { id: 'EMP-003', name: 'Sneha Menon', initials: 'SM', department: 'Design', role: 'Employee', jobTitle: 'Designer', manager: 'Vijay R.', joinDate: 'Aug 12, 2022', status: 'active', avatarColor: 'red' },
  { id: 'EMP-004', name: 'Ravi Kumar', initials: 'RK', department: 'HR', role: 'Admin', jobTitle: 'HR Admin', manager: '—', joinDate: 'Jun 1, 2020', status: 'active', avatarColor: 'default' },
];

export const reportStats: StatCardData[] = [
  { color: 'blue', icon: '', label: 'Total Leaves This Month', value: 47, sub: 'Across 23 employees' },
  { color: 'amber', icon: '', label: 'Avg Days Per Employee', value: '2.1', sub: 'Company avg: 1.8' },
  { color: 'red', icon: '', label: 'Absent Without Leave', value: 2, sub: 'Flagged this month' },
  { color: 'green', icon: '', label: 'Approval Rate', value: '91%', sub: '4 rejected this month' },
];

export const leaveByTypeChart: BarChartItem[] = [
  { label: 'Annual', displayValue: 34, percentage: 72, gradient: 'linear-gradient(90deg,#3B82F6,#60A5FA)' },
  { label: 'Sick', displayValue: 13, percentage: 28, gradient: 'linear-gradient(90deg,#EF4444,#F87171)' },
  { label: 'Casual', displayValue: 7, percentage: 15, gradient: 'linear-gradient(90deg,#06B6D4,#22D3EE)' },
  { label: 'Maternity', displayValue: 4, percentage: 8, gradient: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' },
  { label: 'Comp Off', displayValue: 2, percentage: 4, gradient: 'linear-gradient(90deg,#F59E0B,#FCD34D)' },
];

export const leaveByDeptChart: BarChartItem[] = [
  { label: 'Engineering', displayValue: '80%', percentage: 80, gradient: 'linear-gradient(90deg,#3B82F6,#60A5FA)' },
  { label: 'Design', displayValue: '55%', percentage: 55, gradient: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' },
  { label: 'HR', displayValue: '40%', percentage: 40, gradient: 'linear-gradient(90deg,#10B981,#34D399)' },
  { label: 'Operations', displayValue: '62%', percentage: 62, gradient: 'linear-gradient(90deg,#F59E0B,#FCD34D)' },
  { label: 'Sales', displayValue: '35%', percentage: 35, gradient: 'linear-gradient(90deg,#EF4444,#F87171)' },
];

export const upcomingEvents: UpcomingEvent[] = [
  { id: '1', day: 14, month: 'MAR', title: 'Holi — Public Holiday', subtitle: 'Company-wide · All offices', status: 'holiday', color: 'amber' },
  { id: '2', day: 20, month: 'MAR', title: 'Your Annual Leave', subtitle: 'Mar 20 – Mar 22 · 3 days · Approved', status: 'approved', color: 'accent' },
  { id: '3', day: 28, month: 'MAR', title: 'Casual Leave', subtitle: 'Mar 28 · 1 day · Pending approval', status: 'pending', color: 'amber' },
];
