import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/UI';

// Backend uses x-admin-token header (hardcoded: "admin-secret-token-2024")
// We validate by calling /admin/dashboard with the entered token.
export default function AdminLoginPage() {
  const { loginAdmin, authError, isAdminAuthed } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authed, go straight to dashboard
  if (isAdminAuthed) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    const ok = await loginAdmin(token.trim());
    setLoading(false);
    if (ok) navigate('/admin');
  };

  return (
    <div className="page-wrap page-wrap--narrow" style={{ marginTop: '4rem' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🔐</div>
          <h2>Admin Login</h2>
          <p style={{ marginTop: '.4rem', fontSize: '.9rem' }}>Enter your admin token to access the dashboard.</p>
        </div>

        {authError && <Alert type="error">{authError}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token…"
              required
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !token.trim()}>
            {loading ? <><Spinner /> Verifying…</> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
