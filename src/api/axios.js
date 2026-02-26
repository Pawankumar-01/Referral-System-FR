import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────
// API CLIENTS
// ─────────────────────────────────────────────

// Public API client
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Admin API client
export const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject admin token
adminApi.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('admin_token') ||
    import.meta.env.VITE_ADMIN_TOKEN;

  if (token) {
    config.headers['x-admin-token'] = token;
  }
  return config;
});

// Global error handler
const handleError = (error) => {
  if (error.response) {
    const detail = error.response.data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : JSON.stringify(detail);

    return Promise.reject(
      new Error(message || `Error ${error.response.status}`)
    );
  }

  if (error.request) {
    return Promise.reject(
      new Error('Cannot reach the server. Is the backend running?')
    );
  }

  return Promise.reject(error);
};

api.interceptors.response.use((r) => r, handleError);
adminApi.interceptors.response.use((r) => r, handleError);

// ─────────────────────────────────────────────
// PATIENT ROUTES
// ─────────────────────────────────────────────

export const createPatient = (data) =>
  api.post('/patients/', data).then((r) => r.data);

export const getPatient = (patientId) =>
  api.get(`/patients/${patientId}`).then((r) => r.data);

// ─────────────────────────────────────────────
// REFERRAL ROUTES
// ─────────────────────────────────────────────

export const getReferralInfo = (couponCode) =>
  api.get(`/ref/${couponCode}`).then((r) => r.data);

export const registerViaReferral = (data) =>
  api.post('/ref/register', data).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

export const getAdminDashboard = () =>
  adminApi.get('/admin/dashboard').then((r) => r.data);

export const getPatientsOverview = () =>
  adminApi.get('/admin/patients-overview').then((r) => r.data);

// Consultation complete (phone based)
export const markConsultationCompleteByPhone = ({ phone }) =>
  adminApi
    .post('/admin/consultation-complete-by-phone', { phone })
    .then((r) => r.data);

// Medicine complete (MLM trigger, phone based)
export const markMedicineCompleteByPhone = ({
  phone,
  consultation_amount,
  medicine_amount,
}) =>
  adminApi
    .post('/admin/medicine-complete-by-phone', {
      phone,
      consultation_amount,
      medicine_amount,
    })
    .then((r) => r.data);

// ─────────────────────────────────────────────
// WALLET & COMMISSION (MLM)
// ─────────────────────────────────────────────

export const getWallet = (patientId) =>
  api.get(`/wallet/${patientId}`).then((r) => r.data);

export const getCommissionHistory = (patientId) =>
  api.get(`/commission/${patientId}`).then((r) => r.data);

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const getNotifications = (patientId) =>
  api.get(`/notifications/${patientId}`).then((r) => r.data);