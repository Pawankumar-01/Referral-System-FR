import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import 'react-phone-input-2/lib/style.css';

import HomePage           from './pages/HomePage';
import ReferralPage       from './pages/ReferralPage';
import PatientPage        from './pages/PatientPage';
import PatientLookupPage  from './pages/PatientLookupPage';
import RewardsPage        from './pages/RewardsPage';
import NotificationsPage  from './pages/NotificationsPage';
import AdminLoginPage     from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public routes */}
            <Route path="/"                          element={<HomePage />} />
            <Route path="/ref/scan"                  element={<ReferralPage />} />
            <Route path="/patient/lookup"            element={<PatientLookupPage />} />
            <Route path="/patient/:id"               element={<PatientPage />} />
            <Route path="/rewards/:patient_id"       element={<RewardsPage />} />
            <Route path="/notifications/:patient_id" element={<NotificationsPage />} />
            <Route path="/ref" element={<ReferralPage />} />
            <Route path="/ref/:coupon_code" element={<ReferralPage />} />
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={
              <div className="page-wrap" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <h2>404 — Page Not Found</h2>
                <p style={{ marginTop: '.5rem' }}>This page doesn't exist.</p>
              </div>
            } />
          </Routes>
        </main>

        <footer style={{
          background: 'var(--blue-950)',
          color: 'rgba(255,255,255,.4)',
          textAlign: 'center',
          padding: '1.25rem',
          fontSize: '.8rem',
        }}>
          Sai Ganga Panakeia — QR Patient Referral System &copy; {new Date().getFullYear()}
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}
