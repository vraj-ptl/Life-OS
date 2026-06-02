import { isPublicAuthPath } from './authPaths';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('life-os-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();
      const isJson = contentType.includes('application/json');
      const data = isJson && rawBody ? JSON.parse(rawBody) : {};

      if (!response.ok) {
        // Handle 401 — redirect to login
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('life-os-token');
            localStorage.removeItem('life-os-user');
            // Only redirect if not already on public auth pages
            if (!isPublicAuthPath(window.location.pathname)) {
              window.location.href = '/login';
            }
          }
        }

        const fallbackMessage =
          response.statusText || `Request failed with status ${response.status}`;
        throw {
          status: response.status,
          message: data?.message || fallbackMessage,
          ...data
        };
      }

      return data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw {
          success: false,
          message: 'Invalid server response. Please try again.',
          status: 0,
        };
      }

      if (
        error instanceof TypeError ||
        (error instanceof Error && /failed to fetch|networkerror/i.test(error.message))
      ) {
        throw {
          success: false,
          message: 'Cannot reach the API. Please check backend connection.',
          status: 0,
        };
      }

      throw {
        success: false,
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

const api = new ApiClient(API_BASE_URL);
export default api;
export type { ApiResponse };
