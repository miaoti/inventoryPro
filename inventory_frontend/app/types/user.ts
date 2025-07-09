export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: 'OWNER' | 'ADMIN' | 'USER';
  department?: string;
  password?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  department?: string;
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