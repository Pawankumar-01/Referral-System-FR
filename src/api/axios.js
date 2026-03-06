/**
 * api/axios.js  — FIXED
 *
 * Changes:
 *  1. Added getPendingCommissions() — calls the new /admin/pending-commissions
 *     endpoint which returns earner names, replacing the raw getAllCommissions() call
 *     used in the admin dashboard.
 *  2. getAllCommissions() kept for completeness (can be used in reporting).
 *  3. getPortfolio() was already defined — confirmed it points to /portfolio/{id}.
 *  4. All functions return r.data directly for clean usage in components.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────
// API CLIENTS
// ─────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject admin token from sessionStorage or env
adminApi.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('admin_token') ||
    import.meta.env.VITE_ADMIN_TOKEN;
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  return config;
});

// Unified error handler — extracts FastAPI detail string
const handleError = (error) => {
  if (error.response) {
    const detail = error.response.data?.detail;
    const message =
      typeof detail === 'string' ? detail : JSON.stringify(detail);
    return Promise.reject(new Error(message || `Error ${error.response.status}`));
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

export const markConsultationCompleteByPhone = ({ phone }) =>
  adminApi
    .post('/admin/consultation-complete-by-phone', { phone })
    .then((r) => r.data);

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

export const approveCommission = (commissionId) =>
  adminApi
    .post(`/admin/approve-commission/${commissionId}`)
    .then((r) => r.data);

export const claimWallet = (phone, amount) =>
  adminApi
    .post('/admin/claim-wallet', { phone, amount })
    .then((r) => r.data);


// ─────────────────────────────────────────────
// COMMISSION ROUTES
// ─────────────────────────────────────────────

/**
 * Admin use: fetch ALL commissions (for reporting / full list).
 * Includes earner_name in each row.
 */
export const getAllCommissions = () =>
  adminApi.get('/commission/all').then((r) => r.data);

/**
 * Admin use: fetch ONLY pending (credited) commissions.
 * Each row includes earner_name — use this for the approval UI.
 */
export const getPendingCommissions = () =>
  adminApi.get('/admin/pending-commissions').then((r) => r.data);

/**
 * Patient use: commission history for one patient.
 */
export const getCommissionHistory = (patientId) =>
  api.get(`/commission/${patientId}`).then((r) => r.data);


// ─────────────────────────────────────────────
// WALLET ROUTES
// ─────────────────────────────────────────────

export const getWallet = (patientId) =>
  api.get(`/wallet/${patientId}`).then((r) => r.data);


// ─────────────────────────────────────────────
// PORTFOLIO ROUTE  (patient page — single call for all portfolio data)
// ─────────────────────────────────────────────

export const getPortfolio = (patientId) =>
  api.get(`/portfolio/${patientId}`).then((r) => r.data);


// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const getNotifications = (patientId) =>
  api.get(`/notifications/${patientId}`).then((r) => r.data);