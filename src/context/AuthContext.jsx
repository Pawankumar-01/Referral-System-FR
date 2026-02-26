import { createContext, useContext, useState, useCallback } from 'react';
import { getAdminDashboard } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdminAuthed, setIsAdminAuthed] = useState(
    () => !!sessionStorage.getItem('admin_token')
  );
  const [authError, setAuthError] = useState('');

  // Backend uses a hardcoded token checked via x-admin-token header.
  // We validate by making a real request to /admin/dashboard.
  const loginAdmin = useCallback(async (token) => {
    setAuthError('');
    sessionStorage.setItem('admin_token', token);
    try {
      await getAdminDashboard();
      setIsAdminAuthed(true);
      return true;
    } catch (err) {
      sessionStorage.removeItem('admin_token');
      setIsAdminAuthed(false);
      setAuthError(err.message || 'Invalid admin token');
      return false;
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    sessionStorage.removeItem('admin_token');
    setIsAdminAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAdminAuthed, loginAdmin, logoutAdmin, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
