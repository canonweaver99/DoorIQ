import { supabase } from '../supabase/client'

// Safely get API base URL without requiring Constants at module load time
function getApiBaseUrl(): string {
  try {
    const Constants = require('expo-constants').default
    const configUrl = Constants?.expoConfig?.extra?.apiBaseUrl
    
    // Handle string interpolation in app.json
    if (configUrl && typeof configUrl === 'string' && configUrl.includes('process.env')) {
      // Fall back to env var if config has string interpolation
      return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    }
    
    return configUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
  } catch {
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
  }
}

const API_BASE_URL = getApiBaseUrl()

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

  try {
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
  } catch (error: any) {
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - likely can't reach the API
      const isLocalhost = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')
      if (isLocalhost) {
        throw new ApiError(
          'Cannot connect to API server. Make sure your backend is running and accessible. For iOS Simulator, use your computer\'s IP address instead of localhost.',
          0,
          { networkError: true }
        )
      }
      throw new ApiError(
        'Network error: Unable to connect to the server. Please check your internet connection.',
        0,
        { networkError: true }
      )
    }
    throw error
  }
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

  update: (id: string, data: { 
    transcript?: any
    duration_seconds?: number
    end_reason?: string
    overall_score?: number
    rapport_score?: number
    objection_handling_score?: number
    close_score?: number
  }) =>
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

