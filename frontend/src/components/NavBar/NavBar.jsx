import { NavLink, Link, useNavigate } from 'react-router';
import { logOut } from '../../services/authService';
import './NavBar.css';

export default function NavBar({ user, setUser }) {
  const navigate = useNavigate();

  function handleLogOut() {
    logOut();
    setUser(null);
    // The <Link> that was clicked will navigate to "/"
  }

  return (
    <nav className="NavBar">
      <div className="nav-brand">
        <NavLink to="/" className="brand-link">Echo 22</NavLink>
      </div>
      
      {user ? (
        <div className="nav-links">
          <NavLink to="/" end className="nav-item">
            🏠 Dashboard
          </NavLink>
          <NavLink to="/buddy-system" className="nav-item">
            🤝 Buddy System
          </NavLink>
          <NavLink to="/journal" className="nav-item">
            📝 Journal
          </NavLink>
          <NavLink to="/resources" className="nav-item">
            📚 Resources
          </NavLink>
          <NavLink to="/posts" className="nav-item">
            💬 Community
          </NavLink>
          
          <div className="nav-user">
            <span className="welcome-text">Welcome, {user.name}</span>
            <Link to="/" onClick={handleLogOut} className="logout-btn">
              Log Out
            </Link>
          </div>
        </div>
      ) : (
        <div className="nav-auth">
          <NavLink to="/login" className="auth-link">Log In</NavLink>
          <NavLink to="/signup" className="auth-link signup">Sign Up</NavLink>
        </div>
      )}
    </nav>
  );
}