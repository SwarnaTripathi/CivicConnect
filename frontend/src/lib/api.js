import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Tickets ──────────────────────────────────────────
export const getTickets = (params) => api.get('/tickets', { params });
export const submitTicket = (data) => api.post('/tickets', data);
export const resolveTicket = (id) => api.patch(`/tickets/${id}/resolve`);
export const voteQuorum = (id) => api.post(`/quorum/${id}/vote`);

// ── Auth ─────────────────────────────────────────────
export const login = (credentials) => api.post('/auth/login', credentials);

// ── AI Preview ───────────────────────────────────────
export const triagePreview = (text) =>
  axios.post(
    (import.meta.env.VITE_AI_URL || 'http://localhost:8000') + '/api/v1/triage',
    { raw_text: text }
  );
