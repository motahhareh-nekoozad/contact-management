import axios, { AxiosError } from 'axios';
import type {InternalAxiosRequestConfig} from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (originalRequest.url?.includes('login') || originalRequest.url?.includes('refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        handleGlobalLogout();
        return Promise.reject(error);
      }

      try {
  const response = await axios.post(`${BASE_URL}api/auth/refresh`, {
      refresh: refreshToken, 
    });

  const { access_token, refresh_token } = response.data as any;
  const newAccessToken = access_token || response.data.access; 

  localStorage.setItem('access_token', newAccessToken);
  if (refresh_token) {
    localStorage.setItem('refresh_token', refresh_token);
  }

  processQueue(null, newAccessToken);
  isRefreshing = false;

  if (originalRequest.headers) {
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
  }
  return apiClient(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleGlobalLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const handleGlobalLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event('auth-logout'));
};