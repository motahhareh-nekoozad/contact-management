import { apiClient } from './apiClient';

interface LoginResponse {
  access_token: string;   
  token_type: string;
  refresh_token?: string; 
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('auth/login', {
      username,
      password
    });
    
    const { access_token, refresh_token } = response.data;
    
    localStorage.setItem('access_token', access_token);
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }
    
    return response.data;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token && token !== 'undefined';
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};