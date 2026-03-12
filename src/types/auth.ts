export type UserRole = 'employee' | 'manager' | 'hr' | 'admin';

export interface AuthUser {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  department?: { _id: string; name: string; code: string } | null;
  managerId?: string | null;
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
