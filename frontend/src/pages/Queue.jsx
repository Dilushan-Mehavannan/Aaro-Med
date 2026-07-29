import { useState, useEffect } from 'react';
import { useToastStore, useAuthStore } from '../store/index.js';
import { tokenService } from '../services/api.js';

export default function Queue() {
  const [tokens, setTokens] = useState([]);
  const [bookedTokens, setBookedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [cancelingId, setCancelingId] = useState(null);
  const { addToast } = useToastStore();
  const { token, currentUser } = useAuthStore();

  useEffect(() => {
    loadTokens();
    const interval = setInterval(loadTokens, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTokens = async () => {
    try {
      const response = await tokenService.getMyTokens();
      const all = response.data || [];
      setBookedTokens(all);
      const active = all.filter(t => t.status !== 'cancelled' && t.status !== 'completed');
      setTokens(active);
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelToken = async (tokenId) => {
    setCancelingId(tokenId);
    try {
      await tokenService.cancelToken(tokenId);
      addToast('Token cancelled successfully', 'success');
      loadTokens();
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to cancel token', 'error');
    } finally {
      setCancelingId(null);
    }
  };

  const activeTokens = bookedTokens.filter(t => t.status === 'active' || t.status === 'pending');
  const completedTokens = bookedTokens.filter(t => t.status === 'completed');
  const cancelledTokens = bookedTokens.filter(t => t.status === 'cancelled');

  const displayTokens = 
    activeTab === 'active' ? activeTokens :
    activeTab === 'completed' ? completedTokens :
    cancelledTokens;

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', ...containerStyle }}>
      <div style={headerStyle}>
        <h1 style={h1Style}>📊 Your Queue Status</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
          Track your booked tokens and consultation history
        </p>
      </div>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{activeTokens.length}</div>
          <div style={statLabelStyle}>Active Tokens</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{completedTokens.length}</div>
          <div style={statLabelStyle}>Completed</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{cancelledTokens.length}</div>
          <div style={statLabelStyle}>Cancelled</div>
        </div>
      </div>

      <div style={tabsStyle}>
        <button
          onClick={() => setActiveTab('active')}
          style={{ ...tabButtonStyle, ...(activeTab === 'active' ? activeTabStyle : {}) }}
        >
          Active Tokens
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{ ...tabButtonStyle, ...(activeTab === 'completed' ? activeTabStyle : {}) }}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{ ...tabButtonStyle, ...(activeTab === 'cancelled' ? activeTabStyle : {}) }}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Loading tokens...
        </div>
      ) : displayTokens.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>🎫</div>
          <h3 style={emptyTitleStyle}>No tokens in this category</h3>
          <p style={emptyDescStyle}>
            {activeTab === 'active' && 'Book a token to get started'}
            {activeTab === 'completed' && 'Your completed consultations will appear here'}
            {activeTab === 'cancelled' && 'No cancelled tokens'}
          </p>
        </div>
      ) : (
        <div style={tokensListStyle}>
          {displayTokens.map(tokenItem => (
            <div key={tokenItem.id} style={tokenCardStyle}>
              <div style={tokenHeaderStyle}>
                <div>
                  <div style={tokenNumberDisplayStyle}>Token #{tokenItem.tokenNumber}</div>
                  <div style={doctorNameStyle}>{tokenItem.doctorName}</div>
                </div>
                <div style={{ ...statusBadgeStyle, ...getStatusColor(tokenItem.status) }}>
                  {tokenItem.status?.toUpperCase()}
                </div>
              </div>

              <div style={tokenDetailsStyle}>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>📅 Date</span>
                  <span style={detailValueStyle}>
                    {new Date(tokenItem.bookingDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>⏰ Time</span>
                  <span style={detailValueStyle}>
                    {new Date(tokenItem.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>💬 Mode</span>
                  <span style={detailValueStyle}>{tokenItem.consultationType || 'Online'}</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>💰 Fee</span>
                  <span style={detailValueStyle}>Rs. {tokenItem.consultationFee}</span>
                </div>
              </div>

              {tokenItem.status === 'active' || tokenItem.status === 'pending' ? (
                <div style={actionStyle}>
                  <button
                    onClick={() => handleCancelToken(tokenItem.id)}
                    disabled={cancelingId === tokenItem.id}
                    style={cancelBtnStyle}
                  >
                    {cancelingId === tokenItem.id ? '⏳' : '❌'} {cancelingId === tokenItem.id ? 'Cancelling...' : 'Cancel Token'}
                  </button>
                </div>
              ) : tokenItem.status === 'completed' ? (
                <div style={completedActionStyle}>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    ✅ Consultation completed. Check your email for prescription details.
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'active':
      return { background: '#d4edda', color: '#155724' };
    case 'pending':
      return { background: '#fff3cd', color: '#856404' };
    case 'completed':
      return { background: '#d1ecf1', color: '#0c5460' };
    case 'cancelled':
      return { background: '#f8d7da', color: '#721c24' };
    default:
      return { background: '#e2e3e5', color: '#383d41' };
  }
};

const containerStyle = {
  padding: '3rem 2rem',
  maxWidth: '1000px',
  margin: '0 auto',
};

const headerStyle = {
  marginBottom: '2rem',
};

const h1Style = {
  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '0.5rem',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginBottom: '2.5rem',
};

const statCardStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  textAlign: 'center',
  boxShadow: 'rgba(0,0,0,0.08) 0 2px 8px',
};

const statNumberStyle = {
  fontSize: '2.2rem',
  fontWeight: 700,
  color: 'var(--teal)',
  marginBottom: '0.5rem',
};

const statLabelStyle = {
  fontSize: '0.9rem',
  color: 'var(--muted)',
  fontWeight: 500,
};

const tabsStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  borderBottom: '1px solid #e0e0e0',
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
  borderBottomColor: 'var(--teal)',
  color: 'var(--teal)',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem 2rem',
  background: 'var(--mint)',
  borderRadius: '12px',
};

const emptyIconStyle = {
  fontSize: '3.5rem',
  marginBottom: '1rem',
};

const emptyTitleStyle = {
  fontSize: '1.4rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '0.5rem',
};

const emptyDescStyle = {
  color: 'var(--muted)',
  fontSize: '1rem',
};

const tokensListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
};

const tokenCardStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: 'rgba(0,0,0,0.08) 0 2px 8px',
};

const tokenHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #f0f0f0',
};

const tokenNumberDisplayStyle = {
  fontSize: '1.4rem',
  fontWeight: 700,
  color: 'var(--teal)',
};

const doctorNameStyle = {
  fontSize: '0.95rem',
  color: 'var(--muted)',
  marginTop: '0.3rem',
};

const statusBadgeStyle = {
  padding: '0.4rem 1rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 700,
};

const tokenDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginBottom: '1rem',
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const detailLabelStyle = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  fontWeight: 600,
};

const detailValueStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--ink)',
};

const actionStyle = {
  paddingTop: '1rem',
  borderTop: '1px solid #f0f0f0',
};

const cancelBtnStyle = {
  width: '100%',
  padding: '0.8rem',
  background: '#ff6b6b',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const completedActionStyle = {
  paddingTop: '1rem',
  borderTop: '1px solid #f0f0f0',
};
