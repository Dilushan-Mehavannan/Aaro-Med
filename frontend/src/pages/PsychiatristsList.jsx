import { useState, useEffect } from 'react';
import { useToastStore, useAuthStore } from '../store/index.js';
import { doctorService, tokenService } from '../services/api.js';

export default function PsychiatristsList() {
  const [psychiatrists, setPsychiatrists] = useState([]);
  const [filteredPsychiatrists, setFilteredPsychiatrists] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const { addToast } = useToastStore();
  const { token } = useAuthStore();

  const specializations = ['Depression', 'Anxiety', 'PTSD', 'Bipolar', 'OCD', 'Schizophrenia', 'Addiction'];

  useEffect(() => {
    loadPsychiatrists();
  }, []);

  const loadPsychiatrists = async () => {
    try {
      const response = await doctorService.getPsychiatrists();
      setPsychiatrists(response.data);
      setFilteredPsychiatrists(response.data);
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to load psychiatrists', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = psychiatrists;

    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialization) {
      filtered = filtered.filter(p =>
        p.specialization?.includes(specialization)
      );
    }

    setFilteredPsychiatrists(filtered);
  }, [search, specialization, psychiatrists]);

  const handleBookToken = async (doctorId) => {
    if (!token) {
      addToast('Please login to book a token', 'error');
      return;
    }

    setBookingId(doctorId);
    try {
      const response = await tokenService.bookToken({ doctorId, consultationType: 'online' });
      addToast('Token booked successfully! Check your email for details.', 'success');
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to book token', 'error');
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', ...containerStyle }}>
      <div style={sectionHeaderStyle}>
        <span style={tagStyle}>🧠 Mental Wellness</span>
        <h2 style={h2Style}>Confidential Psychiatry Services</h2>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Anonymous consultations with qualified psychiatrists. Your privacy is our priority.
          All sessions are confidential and secure.
        </p>
      </div>

      <div style={filterContainerStyle}>
        <input
          type="text"
          placeholder="🔍 Search by psychiatrist name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
        />
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          style={{ ...inputStyle }}
        >
          <option value="">All Specializations</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          Loading psychiatrists...
        </div>
      ) : filteredPsychiatrists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.1rem' }}>No psychiatrists found matching your criteria.</p>
        </div>
      ) : (
        <div style={cardsGridStyle}>
          {filteredPsychiatrists.map(psychiatrist => (
            <div key={psychiatrist.id} style={cardStyle}>
              <div style={avatarStyle}>
                {psychiatrist.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={nameStyle}>{psychiatrist.name}</h3>
              <p style={{  color: 'var(--purple)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                {psychiatrist.specialization}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', minHeight: '40px', marginBottom: '1rem' }}>
                {psychiatrist.bio || 'Experienced psychiatrist specializing in mental wellness.'}
              </p>

              <div style={detailsStyle}>
                <div style={detailItemStyle}>
                  <span style={labelStyle}>Rate</span>
                  <span style={valueStyle}>Rs. {psychiatrist.consultationFee}</span>
                </div>
                <div style={detailItemStyle}>
                  <span style={labelStyle}>Wait</span>
                  <span style={valueStyle}>{Math.floor(Math.random() * 30) + 5}m</span>
                </div>
              </div>

              <div style={detailsStyle}>
                <div style={detailItemStyle}>
                  <span style={labelStyle}>Mode</span>
                  <div style={tagContainerStyle}>
                    {psychiatrist.consultationMode?.split(',').map((mode, idx) => (
                      <span key={idx} style={modeTagStyle}>{mode.trim()}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleBookToken(psychiatrist.id)}
                disabled={bookingId === psychiatrist.id}
                style={bookBtnStyle}
              >
                {bookingId === psychiatrist.id ? 'Booking...' : '🎫 Book Token'}
              </button>

              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                Your identity remains private during consultation
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  padding: '3rem 2rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

const sectionHeaderStyle = {
  textAlign: 'center',
  marginBottom: '2.5rem',
};

const tagStyle = {
  display: 'inline-block',
  padding: '0.4rem 1rem',
  background: 'var(--mint)',
  color: 'var(--purple)',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 600,
  marginBottom: '1rem',
};

const h2Style = {
  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '0.8rem',
};

const filterContainerStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2.5rem',
  flexWrap: 'wrap',
};

const inputStyle = {
  padding: '0.8rem 1rem',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
};

const cardStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: 'rgba(0,0,0,0.08) 0 2px 8px',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
};

const avatarStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: 'var(--purple)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.8rem',
  fontWeight: 700,
  marginBottom: '1rem',
};

const nameStyle = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '0.3rem',
};

const labelStyle = {
  fontSize: '0.75rem',
  color: 'var(--muted)',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const valueStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--teal)',
};

const detailsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '1rem',
  paddingBottom: '0.8rem',
  borderBottom: '1px solid #f0f0f0',
};

const detailItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const tagContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const modeTagStyle = {
  padding: '0.25rem 0.6rem',
  background: 'var(--mint)',
  color: 'var(--teal)',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
};

const bookBtnStyle = {
  width: '100%',
  padding: '0.8rem',
  background: 'var(--purple)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
