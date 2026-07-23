const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json();

  if (res.status === 401 && !path.startsWith('/auth/')) {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    throw new Error(data.detail || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data: { email: string; password: string; full_name: string; role: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  me: () => request('/auth/me'),

  refresh: (refreshToken: string) =>
    request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),

  // Chat
  chat: (query: string, conversation_id?: string) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ query, conversation_id }) }),

  getConversations: () => request('/chat/conversations'),

  getMessages: (convId: string) => request(`/chat/conversations/${convId}/messages`),

  searchMessages: (q: string) =>
    request(`/chat/search?q=${encodeURIComponent(q)}`),

  deleteConversation: (convId: string) =>
    request(`/chat/conversations/${convId}`, { method: 'DELETE' }),

  // Assistant
  getDashboard: () => request('/assistant/dashboard'),

  // Admin
  uploadDocument: (formData: FormData) =>
    request('/admin/documents', { method: 'POST', body: formData }),

  getDocuments: () => request('/admin/documents'),

  deleteDocument: (id: string) =>
    request(`/admin/documents/${id}`, { method: 'DELETE' }),

  reindexDocuments: () =>
    request('/admin/documents/reindex', { method: 'POST' }),

  // Projects
  getProjects: () => request('/projects'),

  getProject: (id: string) => request(`/projects/${id}`),
};
