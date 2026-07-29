import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';

export default function Header() {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const role = currentUser?.role;

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <Link to="/home" style={logoStyle}>
          <span style={logoIconStyle}>🏥</span>
          MediToken
        </Link>

        <nav style={navStyle}>
          <Link to="/home" style={navLinkStyle}>Home</Link>
          <Link to="/doctors" style={navLinkStyle}>Doctors</Link>
          <Link to="/psychiatrists" style={navLinkStyle}>Mental Health</Link>

          {/* Patient links */}
          {role === 'patient' && <>
            <Link to="/queue" style={navLinkStyle}>Queue</Link>
            <Link to="/payments" style={navLinkStyle}>Payments</Link>
            <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          </>}

          {/* Doctor links */}
          {role === 'doctor' && <>
            <Link to="/doctor-dashboard" style={navLinkStyle}>My Dashboard</Link>
          </>}

          {/* Admin links */}
          {role === 'admin' && <>
            <Link to="/admin" style={navLinkStyle}>Admin</Link>
          </>}

          {/* Common logged-in links */}
          {currentUser && <>
            <Link to="/feedback" style={navLinkStyle}>Feedback</Link>
          </>}

          <Link to="/help" style={navLinkStyle}>Help</Link>
        </nav>

        <div style={authAreaStyle}>
          {currentUser ? (
            <>
              <div style={pillStyle}>
                <span style={avatarStyle}>{currentUser.firstName?.[0]}{currentUser.lastName?.[0]}</span>
                {currentUser.firstName}
                <span style={{ fontSize: '0.72rem', opacity: 0.7, marginLeft: 2 }}>({role})</span>
              </div>
              <button style={btnOutlineStyle} onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={btnOutlineStyle}>Login</Link>
              <Link to="/register" style={btnPrimaryStyle}>Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const headerStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
  background: 'rgba(250,250,247,.92)', backdropFilter: 'blur(16px)',
  borderBottom: '1px solid var(--border)', padding: '0 2rem',
  height: '64px', display: 'flex', alignItems: 'center',
};
const containerStyle = {
  maxWidth: '1200px', width: '100%', margin: '0 auto',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const logoStyle = {
  fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem',
  color: 'var(--teal-dk)', display: 'flex', alignItems: 'center',
  gap: '0.5rem', textDecoration: 'none', cursor: 'pointer', flexShrink: 0,
};
const logoIconStyle = {
  width: '36px', height: '36px', borderRadius: '10px',
  background: 'linear-gradient(135deg,var(--teal),var(--teal-lt))',
  display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1.1rem',
};
const navLinkStyle = {
  fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)',
  textDecoration: 'none', padding: '0.3rem 0.5rem', borderRadius: '6px',
  whiteSpace: 'nowrap',
};
const navStyle = {
  display: 'flex', gap: '0.1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1,
  margin: '0 1rem',
};
const authAreaStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', flexShrink: 0,
};
const pillStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  background: 'var(--mint)', borderRadius: '100px',
  padding: '0.3rem 0.75rem 0.3rem 0.4rem', fontSize: '0.82rem',
  fontWeight: 600, color: 'var(--teal-dk)', border: '1.5px solid var(--teal)',
};
const avatarStyle = {
  width: '26px', height: '26px', borderRadius: '50%', background: 'var(--teal)',
  color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.72rem', fontWeight: 700,
};
const btnPrimaryStyle = {
  display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1.1rem',
  borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, border: 'none',
  cursor: 'pointer', textDecoration: 'none', background: 'var(--teal)', color: '#fff',
};
const btnOutlineStyle = {
  display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1.1rem',
  borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
  border: '1.5px solid var(--teal)', cursor: 'pointer', textDecoration: 'none',
  background: 'transparent', color: 'var(--teal)', fontFamily: "'DM Sans', sans-serif",
};
