import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  LoginResponse,
  Message,
  MessageHistoryResponse,
  SendMessageRequest,
  TypingRequest,
  Profile,
  ProfileCreate,
  ProfileListResponse,
} from '@/types/api';

// Use Next.js API routes as proxy to backend
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token rotation
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = typeof window !== 'undefined' 
          ? localStorage.getItem('refresh_token') 
          : null;

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call rotate endpoint
        const { data } = await axios.post<LoginResponse>(
          `${API_URL}/auth/rotate`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token: newRefreshToken } = data;

        // Update tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        // Update zustand store if available
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('@/stores/authStore');
          useAuthStore.getState().setTokens(access_token, newRefreshToken);
        }

        isRefreshing = false;
        onRefreshed(access_token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Refresh failed, logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          const { useAuthStore } = await import('@/stores/authStore');
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: async (email: string, password: string, username: string): Promise<User> => {
    const { data } = await api.post<User>('/auth/signup', { email, password, username });
    return data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const { data } = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Store refresh token
    if (data.refresh_token && typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    return data;
  },

  rotate: async (refreshToken: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/rotate', {
      refresh_token: refreshToken,
    });
    return data;
  },

  getCurrentUser: async (token?: string): Promise<User> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await api.get<User>('/auth/me', { headers });
    return data;
  },

  getMyProfiles: async (token?: string): Promise<Profile[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await api.get<Profile[]>('/auth/me/profiles', { headers });
    return data;
  },

  createMyProfile: async (profile: ProfileCreate, token?: string): Promise<Profile> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await api.post<Profile>('/auth/me/profiles', profile, { headers });
    return data;
  },
};

// DM APIs
export const dmAPI = {
  sendMessage: async (request: SendMessageRequest): Promise<Message> => {
    const { data } = await api.post<Message>('/dm/send', request);
    return data;
  },

  getMessages: async (
    sourceUid: string,
    targetUid: string,
    beforeUid?: string,
    limit: number = 50
  ): Promise<MessageHistoryResponse> => {
    const params: Record<string, string | number> = {
      source_uid: sourceUid,
      target_uid: targetUid,
      limit,
    };
    if (beforeUid) {
      params.before_uid = beforeUid;
    }

    const { data } = await api.get<MessageHistoryResponse>('/dm/messages', { params });
    return data;
  },

  updateTyping: async (request: TypingRequest): Promise<void> => {
    await api.post('/dm/typing', request);
  },

  // SSE stream connection helper
  // Note: Using custom implementation instead of EventSource to support Authorization header
  createMessageStream: (
    sourceUid: string,
    targetUid: string,
    onMessage: (data: any) => void,
    onError?: (error: Error) => void
  ) => {
    // Use Next.js API route for SSE streaming
    const url = new URL('/api/dm/stream', window.location.origin);
    url.searchParams.append('source_uid', sourceUid);
    url.searchParams.append('target_uid', targetUid);

    const abortController = new AbortController();
    let streamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const connect = async () => {
      try {
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
        };

        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        streamReader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onMessage(data);
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('SSE connection error:', error);
          onError?.(error);
        }
      }
    };

    connect();

    return {
      close: () => {
        try {
          abortController.abort();
          streamReader?.cancel().catch(() => {
            // Ignore cancel errors
          });
        } catch {
          // Ignore abort errors
        }
      },
    };
  },
};

// Profile APIs
export const profileAPI = {
  getCharacterProfiles: async (): Promise<Profile[]> => {
    const { data } = await api.get<ProfileListResponse>('/profiles/characters');
    return data.profiles;
  },
};

// Error handling helper
export const handleAPIError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return axiosError.response?.data?.detail || axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};
