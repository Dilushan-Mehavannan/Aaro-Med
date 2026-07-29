import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/index.js';
import { doctorService, tokenService } from '../services/api.js';

export default function DoctorsList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await doctorService.getAllDoctors();
      setDoctors(response.data);
      setFilteredDoctors(response.data);
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = doctors;

    if (search) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (mode) {
      filtered = filtered.filter(d => d.consultationMode === mode);
    }

    setFilteredDoctors(filtered);
  }, [search, mode, doctors]);

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', ...containerStyle }}>
      <div style={sectionHeaderStyle}>
        <span style={tagStyle}>General Consultations</span>
        <h2 style={h2Style}>Browse Doctors</h2>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
          Choose your doctor, check availability, and book a token instantly.
        </p>
      </div>

      <div style={filterContainerStyle}>
        <input
          type="text"
          placeholder="🔍 Search by name or specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ ...inputStyle }}
        >
          <option value="">All Modes</option>
          <option value="Online">Online</option>
          <option value="Physical">Physical</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          Loading doctors...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          No doctors found
        </div>
      ) : (
        <div style={doctorListStyle}>
          {filteredDoctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} onEChannel={() => navigate(`/e-channel/${doctor.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorCard({ doctor, onEChannel }) {
  return (
    <div style={doctorCardStyle}>
      <div style={avatarStyle}>{doctor.avatar || doctor.name.charAt(0)}</div>
      <div style={docInfoStyle}>
        <h3 style={{ fontSize: '0.97rem', fontWeight: 600, marginBottom: '0.15rem' }}>
          {doctor.name}
        </h3>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{doctor.specialty}</div>
        {doctor.location && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>📍 {doctor.location}</div>}
        <div style={docMetaStyle}>
          <span style={badgeStyle(doctor.consultationMode)}>
            {doctor.consultationMode}
          </span>
          <span style={badgeStyle('success')}>Available</span>
          <span style={badgeStyle('teal')}>LKR {doctor.bookingFee || doctor.consultationFee}</span>
        </div>
        {doctor.rating && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>⭐ {doctor.rating.toFixed(1)} ({doctor.reviews || 0} reviews)</div>}
      </div>
      <div style={tokenSlotStyle}>
        <div style={tokenNumStyle}>{doctor.waitingCount || 0}</div>
        <div style={tokenLblStyle}>{doctor.waitingCount || 0} ahead</div>
      </div>
      <button style={eChannelButtonStyle} onClick={onEChannel}>
        📞 E-Channel
      </button>
    </div>
  );
}

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem 1.5rem',
};

const sectionHeaderStyle = {
  textAlign: 'center',
  marginBottom: '2.5rem',
};

const tagStyle = {
  display: 'inline-block',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '0.25rem 0.65rem',
  borderRadius: '100px',
  background: 'var(--mint)',
  color: 'var(--teal-dk)',
  marginBottom: '0.8rem',
};

const h2Style = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
  marginBottom: '0.6rem',
};

const filterContainerStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  marginBottom: '1.5rem',
};

const inputStyle = {
  padding: '0.6rem 1rem',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.88rem',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  color: 'var(--ink)',
  background: 'var(--cream)',
};

const doctorListStyle = {
  display: 'grid',
  gap: '1rem',
};

const doctorCardStyle = {
  background: 'var(--white)',
  borderRadius: 'var(--r)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  transition: 'all 0.25s',
  cursor: 'pointer',
};

const avatarStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '14px',
  display: 'grid',
  placeItems: 'center',
  fontSize: '1.5rem',
  flexShrink: 0,
  background: 'linear-gradient(135deg,var(--teal),var(--teal-lt))',
  color: '#fff',
  fontFamily: "'DM Serif Display', serif",
};

const docInfoStyle = {
  flex: 1,
};

const docMetaStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  marginTop: '0.5rem',
};

const badgeStyle = (type) => ({
  fontSize: '0.7rem',
  fontWeight: 500,
  padding: '0.2rem 0.55rem',
  borderRadius: '100px',
  background: type === 'teal' ? 'var(--mint)' : type === 'success' ? '#E6FAF3' : 'var(--cream)',
  color: type === 'teal' ? 'var(--teal-dk)' : type === 'success' ? 'var(--success)' : 'var(--muted)',
});

const tokenSlotStyle = {
  textAlign: 'right',
  flexShrink: 0,
};

const tokenNumStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '1.8rem',
  fontWeight: 500,
  color: 'var(--teal-dk)',
  lineHeight: 1,
};

const tokenLblStyle = {
  fontSize: '0.65rem',
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const eChannelButtonStyle = {
  padding: '0.6rem 1.2rem',
  background: 'linear-gradient(135deg, var(--teal), var(--teal-lt))',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
  flexShrink: 0,
  boxShadow: '0 4px 16px rgba(11, 139, 139, 0.2)',
};
