import { getApiClient } from '../lib/api-client';
import { API } from '../constants/api';
import type { LoginInput, RegisterInput, AuthResponse } from '../types/auth';
import type { User } from '../types/user';

export const authService = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await getApiClient().post<AuthResponse>(API.ENDPOINTS.AUTH.LOGIN, input);
    return data;
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const { data } = await getApiClient().post<AuthResponse>(API.ENDPOINTS.AUTH.REGISTER, input);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await getApiClient().post(API.ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    const { data } = await getApiClient().post(API.ENDPOINTS.AUTH.REFRESH, { refreshToken });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await getApiClient().get<User>(API.ENDPOINTS.AUTH.ME);
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await getApiClient().post(API.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await getApiClient().post(API.ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await getApiClient().post(API.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      newPasswordConfirmation: newPassword,
    });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await getApiClient().post(API.ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  },

  sendVerification: async (): Promise<void> => {
    await getApiClient().post(API.ENDPOINTS.AUTH.SEND_VERIFICATION);
  },
};
