import { apiRequest } from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserResponse,
} from './types';

export const authApi = {
  register(body: RegisterRequest) {
    return apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body, auth: false });
  },
  login(body: LoginRequest) {
    return apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body, auth: false });
  },
  me() {
    return apiRequest<UserResponse>('/api/auth/me');
  },
  updateProfile(body: UpdateProfileRequest) {
    return apiRequest<UserResponse>('/api/auth/me', { method: 'PUT', body });
  },
};
