import Constants from 'expo-constants'
import { supabase } from '../supabase/client'

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = await getAuthHeaders()

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { error: response.statusText }
    }

    throw new ApiError(
      errorData.error || errorData.message || 'Request failed',
      response.status,
      errorData
    )
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return {} as T
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
}

// Specific API endpoints
export const sessionApi = {
  create: (agentName: string) =>
    api.post<{ id: string }>('/api/session', { agent_name: agentName }),

  update: (id: string, data: { transcript?: any; duration_seconds?: number; end_reason?: string }) =>
    api.patch(`/api/session`, { id, ...data }),

  get: (id: string) => api.get(`/api/session?id=${id}`),

  increment: () => api.post('/api/session/increment'),
}

export const elevenApi = {
  getConversationToken: (agentId: string) =>
    api.post<{ conversation_token: string }>('/api/eleven/conversation-token', {
      agentId,
    }),
}

export const userApi = {
  getProfile: () => api.get('/api/users/profile'),
}

