const isDev = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDev ? 'http://localhost:3000' : (typeof window !== 'undefined' ? window.location.origin : '');

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Server bilan ulanishda xatolik');
  }

  return data;
}

export const api = {
  login: (payload) => request('/api/login', { method: 'POST', body: JSON.stringify(payload) }),
  settings: {
    get: () => request('/api/settings'),
    save: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) })
  },
  teachers: {
    list: () => request('/api/teachers'),
    create: (payload) => request('/api/teachers', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/teachers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/teachers/${id}`, { method: 'DELETE' })
  },
  groups: {
    list: () => request('/api/groups'),
    create: (payload) => request('/api/groups', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/groups/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/groups/${id}`, { method: 'DELETE' })
  },
  payments: {
    list: () => request('/api/payments'),
    create: (payload) => request('/api/payments', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/payments/${id}`, { method: 'DELETE' })
  }
};
