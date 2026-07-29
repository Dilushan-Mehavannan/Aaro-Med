import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusColor = { waiting: 'badge-primary', serving: 'badge-success', completed: 'badge-secondary', denied: 'badge-danger', cancelled: 'badge-danger', pending: 'badge-warning' };
const statusBadge = { open: 'badge-danger', 'in-progress': 'badge-warning', closed: 'badge-success' };

function TokenCard({ token, onRefresh }) {
  const navigate = useNavigate();
  const consultation = token.consultation;
  const prescription = consultation?.prescription;
  const [callUrl, setCallUrl] = useState(null);

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    socket.on('call:ready', ({ roomUrl }) => setCallUrl(roomUrl));
    socket.on('prescription:unlocked', () => onRefresh());
    return () => { socket.off('call:ready'); socket.off('prescription:unlocked'); };
  }, [socket]);

  return (
    <div className="glass-card" style={{ borderLeft: `3px solid ${token.status === 'serving' ? 'var(--success)' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-light)', lineHeight: 1 }}>#{token.token_number}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Dr. {token.doctor_id?.user?.name || 'Doctor'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span className={`badge ${statusColor[token.status] || 'badge-secondary'}`}>{token.status}</span>
          <span className={`badge ${token.consultation_mode === 'online' ? 'badge-info' : 'badge-secondary'}`}>
            {token.consultation_mode === 'online' ? '📹 Online' : '🏥 Physical'}
          </span>
          {token.is_anonymous && <span className="badge badge-warning">🔒 Anonymous</span>}
        </div>
      </div>

      {token.queue_position && token.status === 'waiting' && (
        <div style={{ background: 'rgba(37,99,235,0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            📍 Queue position: <strong style={{ color: 'var(--primary-light)' }}>#{token.queue_position}</strong>
            &nbsp;· Est. wait: <strong>{token.queue_position * 10} mins</strong>
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(() => {
          const dId = token.doctor_id?._id || token.doctor_id?.id || (typeof token.doctor_id === 'string' ? token.doctor_id : null);
          return <Link to={`/queue/${dId}`} className="btn btn-ghost btn-sm">📊 Track Queue</Link>;
        })()}

        {callUrl && token.consultation_mode === 'online' && (
          <Link to={`/call/${consultation?.id}`} className="btn btn-success btn-sm">📹 Join Call</Link>
        )}

        {consultation?.status === 'completed' && !prescription && (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 0' }}>Awaiting prescription...</span>
        )}

        {prescription && prescription.is_locked && (
          <Link to={`/prescription/${prescription.id}`} className="btn btn-warning btn-sm">💳 Pay for Prescription</Link>
        )}

        {prescription && !prescription.is_locked && (
          <>
            <Link to={`/prescription/${prescription.id}`} className="btn btn-secondary btn-sm">💊 View Prescription</Link>
            <Link to={`/feedback/${consultation.id}`} className="btn btn-ghost btn-sm">⭐ Give Feedback</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const { user, fetchMe } = useAuth();
  const [tab, setTab] = useState('tokens');
  const [tokens, setTokens] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState({ issueType: 'general', description: '' });
  const [ticketList, setTicketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(user?.profile_pic || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePic(user.profile_pic || '');
    }
  }, [user]);

  const handleProfilePicChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', { name: profileName, profilePic });
      await fetchMe();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchTokens = async () => {
    try {
      const res = await api.get('/patient/tokens/my');
      setTokens(res.data);
    } catch (err) {
      console.error('[ERROR] fetchTokens:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/patient/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('[ERROR] fetchNotifications:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/patient/support');
      setTicketList(res.data);
    } catch (err) {
      console.error('[ERROR] fetchTickets:', err);
    }
  };

  useEffect(() => {
    fetchTokens().finally(() => setLoading(false));
    fetchNotifications();
    fetchTickets();
  }, []);

  const submitTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patient/support', { issueType: tickets.issueType, description: tickets.description });
      toast.success('Support ticket submitted!');
      setTickets({ issueType: 'general', description: '' });
      fetchTickets();
    } catch {
      toast.error('Failed to submit ticket');
    }
  };

  const prescriptions = tokens.filter(t => t.consultation?.prescription && !t.consultation.prescription.is_locked);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your appointments, prescriptions, and more</p>
        </div>

        <div className="tabs">
          {[['tokens','🎫 Active Tokens'], ['prescriptions','💊 Prescriptions'], ['notifications','🔔 Notifications'], ['profile','👤 My Profile'], ['support','🆘 Support']].map(([t, lbl]) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); if (t === 'notifications') fetchNotifications(); }}>
              {lbl}
              {t === 'notifications' && notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginLeft: 4 }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'tokens' && (
          <div>
            {loading ? <div className="loading-spinner" /> : tokens.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No Active Tokens</h3>
                <p>Book a consultation to get started</p>
                <Link to="/doctors" className="btn btn-primary" style={{ marginTop: 16 }}>Find Doctors</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {tokens.map(t => <TokenCard key={t.id || t._id} token={t} onRefresh={fetchTokens} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'prescriptions' && (
          <div>
            {prescriptions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💊</div>
                <h3>No Prescriptions Yet</h3>
                <p>Prescriptions appear here after your consultation</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {prescriptions.map(t => (
                  <div key={t.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Dr. {t.doctor_id?.user?.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(t.consultation.prescription.issued_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/prescription/${t.consultation.prescription.id}`} className="btn btn-secondary btn-sm">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'notifications' && (
          <div>
            {notifications.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔔</div><h3>No Notifications</h3></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map(n => (
                  <div key={n.id} className="glass-card" style={{ opacity: n.is_read ? 0.7 : 1, borderLeft: `3px solid ${n.is_read ? 'var(--border)' : 'var(--primary-light)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9rem' }}>{n.message}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {new Date(n.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="glass-card" style={{ maxWidth: 600 }}>
            <h3 style={{ marginBottom: 20 }}>👤 Update My Profile</h3>
            <form onSubmit={handleProfileSave}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Profile Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-light)' }} />
                  ) : (
                    <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700 }}>
                      {profileName?.charAt(0).toUpperCase() || 'P'}
                    </div>
                  )}
                  <label htmlFor="profile-pic-upload" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', fontSize: '0.9rem' }}>
                    📸
                  </label>
                  <input 
                    type="file" 
                    id="profile-pic-upload" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => handleProfilePicChange(e.target.files[0])} 
                  />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{user?.name}</h4>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email} • {user?.role?.toUpperCase()}</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileName} 
                  onChange={e => setProfileName(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={savingProfile}>
                {savingProfile ? '⏳ Saving Updates...' : '💾 Save Profile Updates'}
              </button>
            </form>
          </div>
        )}

        {tab === 'support' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ marginBottom: 20 }}>Submit a Support Ticket</h3>
              <form onSubmit={submitTicket} className="glass-card">
                <div className="form-group">
                  <label className="form-label">Issue Type</label>
                  <select className="form-input" value={tickets.issueType} onChange={e => setTickets({...tickets, issueType: e.target.value})}>
                    <option value="booking">Booking Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Problem</option>
                    <option value="consultation">Consultation Issue</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={tickets.description} onChange={e => setTickets({...tickets, description: e.target.value})} placeholder="Describe your issue..." required />
                </div>
                <button type="submit" className="btn btn-primary btn-full">Submit Ticket</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}>My Support Tickets</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ticketList.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}><p>No tickets submitted yet</p></div>
                ) : (
                  ticketList.map(t => (
                    <div key={t.id} className="glass-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="badge badge-info">{t.issue_type}</span>
                        <span className={`badge ${statusBadge[t.status] || 'badge-secondary'}`}>{t.status}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>{t.description}</p>
                      {t.response && (
                        <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', color: 'var(--success)' }}>
                          <strong>✉️ Response:</strong> {t.response}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        Submitted: {new Date(t.created_at || t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
