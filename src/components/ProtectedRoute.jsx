import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAdminAuthed } = useAuth();
  return isAdminAuthed ? children : <Navigate to="/admin/login" replace />;
}
