import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useToastStore, useTokenStore } from '../store/index.js';
import { tokenService, prescriptionService } from '../services/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const [tokens, setTokens] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadTokens();
    loadPrescriptions();
  }, [currentUser, navigate]);

  const loadPrescriptions = async () => {
    try {
      const response = await prescriptionService.getPrescriptions();
      setPrescriptions(response.data || []);
    } catch (error) {
      // silently fail
    }
  };

  const loadTokens = async () => {
    try {
      const response = await tokenService.getMyTokens();
      setTokens(response.data || []);
    } catch (error) {
      addToast('Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    addToast('Logged out successfully', 'success');
  };

  const upcomingTokens = tokens.filter(t => t.status === 'active' || t.status === 'pending').slice(0, 3);
  const completedConsultations = tokens.filter(t => t.status === 'completed').length;
  const totalSpent = tokens
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.consultationFee || 0), 0);

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', ...pageStyle }}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={h1Style}>Welcome back, {currentUser?.firstName}! 👋</h1>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
              Manage your consultations and health records
            </p>
          </div>
          <button onClick={handleLogout} style={logoutBtnStyle}>
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statIconStyle}>🎫</div>
            <div>
              <div style={statNumberStyle}>{upcomingTokens.length}</div>
              <div style={statLabelStyle}>Upcoming Tokens</div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statIconStyle}>✅</div>
            <div>
              <div style={statNumberStyle}>{completedConsultations}</div>
              <div style={statLabelStyle}>Consultations Completed</div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statIconStyle}>💰</div>
            <div>
              <div style={statNumberStyle}>Rs. {totalSpent}</div>
              <div style={statLabelStyle}>Total Spent</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabsStyle}>
          <button
            onClick={() => setActiveTab('prescriptions')}
            style={{ ...tabButtonStyle, ...(activeTab === 'prescriptions' ? activeTabStyle : {}) }}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            style={{ ...tabButtonStyle, ...(activeTab === 'overview' ? activeTabStyle : {}) }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{ ...tabButtonStyle, ...(activeTab === 'profile' ? activeTabStyle : {}) }}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{ ...tabButtonStyle, ...(activeTab === 'settings' ? activeTabStyle : {}) }}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={contentStyle}>
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>📅 Upcoming Appointments</h2>
              {loading ? (
                <p style={{ color: 'var(--muted)' }}>Loading...</p>
              ) : upcomingTokens.length === 0 ? (
                <div style={emptyStateStyle}>
                  <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                    No upcoming appointments. Book a consultation now!
                  </p>
                  <button
                    onClick={() => navigate('/doctors')}
                    style={bookBtnStyle}
                  >
                    Find Doctors
                  </button>
                </div>
              ) : (
                <div style={appointmentsListStyle}>
                  {upcomingTokens.map(token => (
                    <div key={token.id} style={appointmentCardStyle}>
                      <div style={appointmentHeaderStyle}>
                        <div>
                          <div style={appointmentDoctorStyle}>{token.doctorName}</div>
                          <div style={appointmentSpecialtyStyle}>{token.specialty}</div>
                        </div>
                        <div style={appointmentTokenStyle}>#{token.tokenNumber}</div>
                      </div>
                      <div style={appointmentDetailsStyle}>
                        <div style={appointmentDetailStyle}>
                          <span>📅</span>
                          <span>{new Date(token.bookingDate).toLocaleDateString()}</span>
                        </div>
                        <div style={appointmentDetailStyle}>
                          <span>⏰</span>
                          <span>{new Date(token.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={appointmentDetailStyle}>
                          <span>💬</span>
                          <span>{token.consultationType || 'Online'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>📊 Recent Consultations</h2>
              {tokens.filter(t => t.status === 'completed').length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
                  No completed consultations yet
                </p>
              ) : (
                <div>
                  <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                    You have completed {completedConsultations} consultations
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div style={contentStyle}>
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>📋 My Prescriptions</h2>
              {prescriptions.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
                  No prescriptions yet. They will appear here after your consultations.
                </p>
              ) : (
                <div>
                  {prescriptions.map((p) => (
                    <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.diagnosis}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>By {p.doctorName} • {new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: '#10b98122', color: '#10b981' }}>✅ Issued</span>
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        <strong style={{ fontSize: '0.85rem' }}>Medications:</strong>
                        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
                          {(p.medications || []).map((m, i) => (
                            <li key={i} style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                              {m.name} — {m.dosage}, {m.frequency}, {m.duration}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {p.notes && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>{p.notes}</p>}
                      {p.followUpDays > 0 && <p style={{ marginTop: '0.25rem', fontSize: '0.82rem', color: '#f59e0b' }}>⏰ Follow-up in {p.followUpDays} days</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={contentStyle}>
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>👤 Personal Information</h2>
              <div style={profileGridStyle}>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>First Name</label>
                  <div style={fieldValueStyle}>{currentUser?.firstName}</div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Last Name</label>
                  <div style={fieldValueStyle}>{currentUser?.lastName}</div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Email</label>
                  <div style={fieldValueStyle}>{currentUser?.email}</div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Phone</label>
                  <div style={fieldValueStyle}>{currentUser?.phone || 'Not provided'}</div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Date of Birth</label>
                  <div style={fieldValueStyle}>
                    {currentUser?.dateOfBirth 
                      ? new Date(currentUser.dateOfBirth).toLocaleDateString() 
                      : 'Not provided'}
                  </div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Gender</label>
                  <div style={fieldValueStyle}>{currentUser?.gender || 'Not provided'}</div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Address</label>
                  <div style={fieldValueStyle}>{currentUser?.address || 'Not provided'}</div>
                </div>
                <div style={profileFieldStyle}>
                  <label style={fieldLabelStyle}>Account Type</label>
                  <div style={fieldValueStyle}>
                    <span style={roleBadgeStyle}>{currentUser?.role?.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => addToast('Profile editing coming soon', 'info')}
                style={editBtnStyle}
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={contentStyle}>
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>⚙️ Preferences</h2>
              <div style={settingItemStyle}>
                <div>
                  <div style={settingLabelStyle}>Email Notifications</div>
                  <p style={settingDescStyle}>Receive email updates about your appointments</p>
                </div>
                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              </div>
              <div style={settingItemStyle}>
                <div>
                  <div style={settingLabelStyle}>SMS Reminders</div>
                  <p style={settingDescStyle}>Get SMS reminders before your consultations</p>
                </div>
                <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              </div>
              <div style={settingItemStyle}>
                <div>
                  <div style={settingLabelStyle}>Newsletter</div>
                  <p style={settingDescStyle}>Stay updated with health tips and promotions</p>
                </div>
                <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>🔐 Security</h2>
              <button
                onClick={() => addToast('Change password feature coming soon', 'info')}
                style={changePassBtnStyle}
              >
                Change Password
              </button>
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>❌ Danger Zone</h2>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    addToast('Account deletion not yet available', 'info');
                  }
                }}
                style={deleteBtnStyle}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  background: 'linear-gradient(135deg, var(--mint) 0%, var(--cream) 100%)',
  minHeight: '100vh',
  padding: '2rem 0',
};

const containerStyle = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '0 2rem',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2.5rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const h1Style = {
  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
  fontWeight: 700,
  color: 'var(--ink)',
};

const logoutBtnStyle = {
  padding: '0.7rem 1.5rem',
  background: '#ff6b6b',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2.5rem',
};

const statCardStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  boxShadow: 'rgba(0,0,0,0.08) 0 2px 8px',
};

const statIconStyle = {
  fontSize: '2.5rem',
};

const statNumberStyle = {
  fontSize: '1.8rem',
  fontWeight: 700,
  color: 'var(--teal)',
};

const statLabelStyle = {
  fontSize: '0.9rem',
  color: 'var(--muted)',
  marginTop: '0.3rem',
};

const tabsStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '2rem',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  borderRadius: '12px 12px 0 0',
  padding: '1rem 1.5rem 0',
};

const tabButtonStyle = {
  padding: '0.8rem 1.5rem',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--muted)',
  transition: 'all 0.2s ease',
};

const activeTabStyle = {
  color: 'var(--teal)',
  borderBottomColor: 'var(--teal)',
};

const contentStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: 'rgba(0,0,0,0.08) 0 2px 8px',
};

const sectionStyle = {
  marginBottom: '2.5rem',
};

const sectionTitleStyle = {
  fontSize: '1.3rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '1.5rem',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '2rem',
  background: 'var(--mint)',
  borderRadius: '8px',
};

const bookBtnStyle = {
  padding: '0.8rem 1.5rem',
  background: 'var(--teal)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
};

const appointmentsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const appointmentCardStyle = {
  background: 'var(--mint)',
  borderRadius: '8px',
  padding: '1.2rem',
  borderLeft: '4px solid var(--teal)',
};

const appointmentHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.8rem',
};

const appointmentDoctorStyle = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: 'var(--ink)',
};

const appointmentSpecialtyStyle = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginTop: '0.2rem',
};

const appointmentTokenStyle = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: 'var(--purple)',
};

const appointmentDetailsStyle = {
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const appointmentDetailStyle = {
  display: 'flex',
  gap: '0.5rem',
  fontSize: '0.9rem',
  color: 'var(--ink)',
};

const profileGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
  marginBottom: '1.5rem',
};

const profileFieldStyle = {
  background: 'var(--mint)',
  borderRadius: '8px',
  padding: '1rem',
};

const fieldLabelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--muted)',
  fontWeight: 600,
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
};

const fieldValueStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--ink)',
};

const roleBadgeStyle = {
  display: 'inline-block',
  padding: '0.4rem 0.8rem',
  background: 'var(--purple)',
  color: 'white',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 600,
};

const editBtnStyle = {
  padding: '0.8rem 1.5rem',
  background: 'var(--teal)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
};

const settingItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.2rem',
  borderBottom: '1px solid #f0f0f0',
};

const settingLabelStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--ink)',
};

const settingDescStyle = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginTop: '0.3rem',
};

const changePassBtnStyle = {
  padding: '0.8rem 1.5rem',
  background: 'var(--purple)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: '1rem',
};

const deleteBtnStyle = {
  padding: '0.8rem 1.5rem',
  background: '#ff6b6b',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
};
