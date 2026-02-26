import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAdminAuthed, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          Sai Ganga<span>Panakeia</span>
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>Home</NavLink>
          {isAdminAuthed ? (
            <>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
              <button onClick={() => { logoutAdmin(); navigate('/admin/login'); }}>Logout</button>
            </>
          ) : (
            <NavLink to="/admin/login" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
