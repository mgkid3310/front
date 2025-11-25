import axios, { AxiosError } from 'axios';
import type {
  User,
  LoginResponse,
  Message,
  MessageHistoryResponse,
  SendMessageRequest,
  TypingRequest,
} from '@/types/api';

// Use Next.js API routes as proxy to backend
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
    return data;
  },

  getCurrentUser: async (token?: string): Promise<User> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await api.get<User>('/auth/me', { headers });
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    // Use Next.js API route for SSE streaming
    const url = new URL('/api/dm/stream', window.location.origin);
    url.searchParams.append('source_uid', sourceUid);
    url.searchParams.append('target_uid', targetUid);

    const abortController = new AbortController();
    let streamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const connect = async () => {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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

// Error handling helper
export const handleAPIError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return axiosError.response?.data?.detail || axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};
