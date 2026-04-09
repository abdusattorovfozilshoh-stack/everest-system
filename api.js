/* ═══════════════════════════════════════════════════
   EVEREST O'QUV MARKAZI — Centralized API Module
   Ushbu fayl barcha API so'rovlarini boshqaradi.
   Server bilan ishonchli ulanishni ta'minlaydi.
═══════════════════════════════════════════════════ */

const API_CONFIG = {
    get BASE_URL() {
        const h = window.location.hostname;
        const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '';
        // Agar lokal bo'lsa localhost:3000, aks holda joriy sayt manzilini ishlatadi
        return isLocal ? 'http://localhost:3000' : window.location.origin;
    }
};

/**
 * Unified API Request function
 */
async function apiRequest(endpoint, options = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;
    
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    const fetchOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, fetchOptions);
        
        // JSON formatida javobni kutish (agar mavjud bo'lsa)
        let data = {};
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `Xatolik: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Maxsus xabarlar
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const err = new Error("Server bilan ulanish mavjud emas");
            err.isOffline = true;
            throw err;
        }
        
        throw error;
    }
}

/**
 * Server holatini tekshirish
 */
async function checkHealth() {
    try {
        const url = API_CONFIG.BASE_URL + '/api/teachers'; // Oddiy endpoint
        const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Common Data Fetchers
 */
const API = {
    settings: {
        get: () => apiRequest('/api/settings'),
        save: (data) => apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
    },
    login: (payload) => apiRequest('/api/login', { method: 'POST', body: JSON.stringify(payload) }),
    teachers: {
        list: () => apiRequest('/api/teachers'),
        add: (data) => apiRequest('/api/teachers', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => apiRequest(`/api/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => apiRequest(`/api/teachers/${id}`, { method: 'DELETE' })
    },
    groups: {
        list: () => apiRequest('/api/groups'),
        add: (data) => apiRequest('/api/groups', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => apiRequest(`/api/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => apiRequest(`/api/groups/${id}`, { method: 'DELETE' })
    },
    payments: {
        list: () => apiRequest('/api/payments'),
        add: (data) => apiRequest('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => apiRequest(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => apiRequest(`/api/payments/${id}`, { method: 'DELETE' })
    }
};

// Global export for legacy scripts
window.apiRequest = apiRequest;
window.checkHealth = checkHealth;
window.API = API;
