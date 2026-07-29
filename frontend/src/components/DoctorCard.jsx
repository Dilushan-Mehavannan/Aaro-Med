import { Link } from 'react-router-dom';

const specializationEmoji = {
  General: '🩺', Cardiologist: '❤️', Psychiatrist: '🧠', Dermatologist: '🌿',
  Neurologist: '🧬', Orthopedic: '🦴', Pediatrician: '👶', Ophthalmologist: '👁️',
  default: '👨‍⚕️'
};

const Stars = ({ rating }) => {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#334155', fontSize: '0.85rem' }}>★</span>
      ))}
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 4 }}>({parseFloat(rating || 0).toFixed(1)})</span>
    </div>
  );
};

export default function DoctorCard({ doctor, showBookButton = true, activeMode = '' }) {
  const emoji = specializationEmoji[doctor.specialization] || specializationEmoji.default;
  const doctorName = doctor.user?.name || doctor.name || 'Doctor';
  const available = doctor.is_available !== false;

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
          border: '1px solid rgba(37,99,235,0.2)',
          overflow: 'hidden'
        }}>
          {doctor.user?.profile_pic ? (
            <img src={doctor.user.profile_pic} alt={doctorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            emoji
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>{doctorName}</h4>
          <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doctor.specialization}</p>
          <Stars rating={doctor.rating_avg} />
        </div>
        <div>
          <span className={`badge ${available ? 'badge-success' : 'badge-danger'}`}>
            {available ? '● Open' : '● Full'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {activeMode === 'online' ? (
          <span className="badge badge-info">📹 Online</span>
        ) : activeMode === 'physical' ? (
          <span className="badge badge-secondary">🏥 Physical</span>
        ) : (
          <>
            {(doctor.consultation_type === 'online' || doctor.consultation_type === 'both') && <span className="badge badge-info">📹 Online</span>}
            {(doctor.consultation_type === 'physical' || doctor.consultation_type === 'both') && <span className="badge badge-secondary">🏥 Physical</span>}
          </>
        )}
        {doctor.qualification && <span className="badge badge-secondary">{doctor.qualification}</span>}
      </div>

      {/* Fees */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Booking Fee</div>
          <div style={{ fontWeight: 700, color: 'var(--warning)' }}>LKR {parseFloat(doctor.booking_fee || 0).toFixed(2)}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Consultation Fee</div>
          <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>LKR {parseFloat(doctor.consultation_fee || 0).toFixed(2)}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Slots Left</div>
          <div style={{ fontWeight: 700, color: available ? 'var(--success)' : 'var(--danger)' }}>
            {doctor.available_slots ?? (doctor.daily_limit - (doctor.booked_today || 0))}
          </div>
        </div>
      </div>

      {/* Clinic */}
      {doctor.clinic_name && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          🏥 {doctor.clinic_name}
        </p>
      )}

      {showBookButton && (
        <Link to={`/doctors/${doctor.id}${activeMode ? `?mode=${activeMode}` : ''}`} className="btn btn-primary btn-full">
          View Profile & Book
        </Link>
      )}
    </div>
  );
}
