export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  alertEmail?: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  department?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  createdAt: string;
  updatedAt: string;
  isPhantomUser?: boolean;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  alertEmail?: string;
  role?: 'OWNER' | 'ADMIN' | 'USER';
  department?: string;
  password?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  department?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  email?: string;
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
} 