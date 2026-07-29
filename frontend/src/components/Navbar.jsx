import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNavbarNotifications = async (markAsRead = false) => {
    if (!user) return;
    try {
      let endpoint = '';
      if (role === 'patient') endpoint = `/patient/notifications?markRead=${markAsRead}`;
      else if (['doctor', 'psychiatrist'].includes(role)) endpoint = `/doctor/notifications?markRead=${markAsRead}`;
      else if (role === 'admin') endpoint = `/admin/notifications?markRead=${markAsRead}`;

      if (endpoint) {
        const res = await api.get(endpoint);
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('[ERROR] fetchNavbarNotifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNavbarNotifications(false);
      // Poll notifications every 10 seconds for real-time feel
      const interval = setInterval(() => {
        fetchNavbarNotifications(false);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, role]);

  const handleToggleDropdown = () => {
    const nextState = !showNotifDropdown;
    setShowNotifDropdown(nextState);
    if (nextState) {
      fetchNavbarNotifications(true); // Mark all as read
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const roleLinks = {
    patient: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Find Doctors', path: '/doctors' },
      { label: 'Mental Health', path: '/mental-health' },
    ],
    doctor: [{ label: 'Dashboard', path: '/doctor/dashboard' }],
    psychiatrist: [{ label: 'Dashboard', path: '/doctor/dashboard' }],
    admin: [{ label: 'Admin Panel', path: '/admin' }],
  };

  const links = user ? (roleLinks[role] || []) : [
    { label: 'Find Doctors', path: '/doctors' },
    { label: 'Mental Health', path: '/mental-health' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          🏥 <span>SmartDoctor</span>
        </Link>

        {/* Desktop Navbar Links */}
        <div className="navbar-links desktop-only">
          {links.map((l) => (
            <Link key={l.path} to={l.path} className={`navbar-link ${isActive(l.path)}`}>
              {l.label}
            </Link>
          ))}

          {!user && (
            <>
              <Link to="/register?role=patient" className="navbar-link">For Patients</Link>
              <Link to="/doctor/register" className="navbar-link">For Doctors</Link>
              <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
            </>
          )}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              
              {/* Notification Bell Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={handleToggleDropdown} 
                  className="navbar-link" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '6px 10px', display: 'flex', alignItems: 'center', position: 'relative' }}
                >
                  🔔
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: 2, 
                      right: 4, 
                      background: 'var(--danger)', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: 16, 
                      height: 16, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.6rem', 
                      fontWeight: 800 
                    }}>
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="glass-card" style={{ 
                    position: 'absolute', 
                    top: '40px', 
                    right: 0, 
                    width: 320, 
                    maxHeight: 400, 
                    overflowY: 'auto', 
                    zIndex: 1000, 
                    padding: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 8 }}>
                      <strong style={{ fontSize: '0.85rem' }}>Notifications</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {notifications.slice(0, 5).map(n => (
                          <div key={n.id} style={{ 
                            padding: '8px 10px', 
                            borderRadius: 6, 
                            background: n.is_read ? 'transparent' : 'rgba(37,99,235,0.06)',
                            borderLeft: `2.5px solid ${n.is_read ? 'transparent' : 'var(--primary-light)'}`,
                            transition: 'background 0.2s'
                          }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.message}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              {new Date(n.sent_at || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(37,99,235,0.1)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.3)' }}>
                {user.profile_pic ? (
                  <img src={user.profile_pic} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.name?.split(' ')[0]}</span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="mobile-drawer fade-in">
          {links.map((l) => (
            <Link 
              key={l.path} 
              to={l.path} 
              className={`mobile-link ${isActive(l.path)}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}

          {!user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <Link to="/register?role=patient" className="mobile-link" onClick={() => setMenuOpen(false)}>For Patients</Link>
              <Link to="/doctor/register" className="mobile-link" onClick={() => setMenuOpen(false)}>For Doctors</Link>
              <Link to="/login" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Sign In</Link>
            </div>
          )}

          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {user.profile_pic ? (
                  <img src={user.profile_pic} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                  <span className="badge badge-primary" style={{ width: 'fit-content', fontSize: '0.65rem' }}>{role}</span>
                </div>
              </div>

              <button 
                onClick={() => { setMenuOpen(false); handleLogout(); }} 
                className="btn btn-danger btn-full"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
