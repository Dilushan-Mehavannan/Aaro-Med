import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Stars = ({ rating }) => (
  <span style={{ color: 'var(--warning)' }}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
);

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const activeMode = searchParams.get('mode') || '';
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/patient/doctors/${doctorId}`).then(res => setDoctor(res.data)).finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!doctor) return <div className="page-loading"><p>Doctor not found</p></div>;

  const isAvailable = doctor.available_slots > 0;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <Link to="/doctors" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-block', marginBottom: 24 }}>← Back to Doctors</Link>

        <div className="grid-auto" style={{ gap: 28 }}>
          {/* Main Info */}
          <div>
            <div className="glass-card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0, overflow: 'hidden' }}>
                  {doctor.user?.profile_pic ? (
                    <img src={doctor.user.profile_pic} alt={doctor.user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '👨‍⚕️'
                  )}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Dr. {doctor.user?.name}</h1>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{doctor.specialization} · {doctor.qualification}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Stars rating={doctor.rating_avg} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({parseFloat(doctor.rating_avg || 0).toFixed(1)})</span>
                    <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {isAvailable ? '● Available' : '● Full Today'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div className="grid-2" style={{ marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Clinic</div>
                  <div style={{ fontWeight: 600 }}>{doctor.clinic_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{doctor.clinic_address}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Working Hours</div>
                  <div style={{ fontWeight: 600 }}>{doctor.working_hours_start || '08:00'} – {doctor.working_hours_end || '17:00'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Daily limit: {doctor.daily_limit} patients</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Consultation Types</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                {(activeMode === 'online' || activeMode === 'both' || (!activeMode && (doctor.consultation_type === 'online' || doctor.consultation_type === 'both'))) && (
                  <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📹</div>
                    <div style={{ fontWeight: 600 }}>Online</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Video Consultation</div>
                  </div>
                )}
                {(activeMode === 'physical' || activeMode === 'both' || (!activeMode && (doctor.consultation_type === 'physical' || doctor.consultation_type === 'both'))) && (
                  <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏥</div>
                    <div style={{ fontWeight: 600 }}>Physical</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doctor.clinic_name}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: 16 }}>Today's Availability</h3>
              <div className="grid-3">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)' }}>{doctor.daily_limit}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Limit</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{doctor.booked_today || 0}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Booked Today</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: isAvailable ? 'var(--success)' : 'var(--danger)' }}>{doctor.available_slots}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Slots Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div>
            <div className="glass-card" style={{ position: 'sticky', top: 90 }}>
              <h3 style={{ marginBottom: 16 }}>Book Consultation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Booking Fee</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>LKR {parseFloat(doctor.booking_fee || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Consultation Fee</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>LKR {parseFloat(doctor.consultation_fee || 0).toFixed(2)}</span>
                </div>
              </div>

              {user ? (
                isAvailable ? (
                  <Link to={`/book/${doctor.id}${activeMode ? `?mode=${activeMode}` : ''}`} className="btn btn-primary btn-full btn-lg">Book Consultation</Link>
                ) : (
                  <button className="btn btn-ghost btn-full" disabled>No slots available today</button>
                )
              ) : (
                <Link to="/" className="btn btn-primary btn-full">Sign In to Book</Link>
              )}

              <div className="divider" />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                🔒 Secure payment via PayHere
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
