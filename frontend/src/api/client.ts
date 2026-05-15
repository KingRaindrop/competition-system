const rawBase = import.meta.env.VITE_API_BASE
export const API_BASE_URL = rawBase === undefined ? 'http://localhost:3000' : rawBase

export function resolveUrl(path: string): string {
  const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : location.origin
  return new URL(path, base).toString()
}

interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string>
}

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getToken(): string | null {
  return localStorage.getItem('comp_sys_token')
}

export function setToken(token: string) {
  localStorage.setItem('comp_sys_token', token)
}

export function clearToken() {
  localStorage.removeItem('comp_sys_token')
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const url = new URL(resolveUrl(path))
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const headers: Record<string, string> = {
    ...options.headers,
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, data.message || '请求失败')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get<T>(path: string, params?: Record<string, string>) {
    return request<T>('GET', path, undefined, { params })
  },
  post<T>(path: string, body?: unknown) {
    return request<T>('POST', path, body)
  },
  put<T>(path: string, body?: unknown) {
    return request<T>('PUT', path, body)
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>('PATCH', path, body)
  },
  delete<T>(path: string) {
    return request<T>('DELETE', path)
  },
}
