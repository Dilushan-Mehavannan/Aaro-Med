import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';

export default function MentalHealthPage() {
  const [psychiatrists, setPsychiatrists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patient/doctors/psychiatrists').then(res => setPsychiatrists(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1a0a2e 100%)', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 600 }}>🔒 100% Anonymous · Identity Protected</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Mental Health Support<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>You Are Safe Here</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: 32 }}>
            Your mental health matters. Speak to licensed psychiatrists completely anonymously. 
            No names, no records shared, no judgment. Your identity is fully protected.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { icon: '🔒', label: 'Anonymous Identity' },
              { icon: '🛡️', label: 'End-to-End Secure' },
              { icon: '📹', label: 'Private Video Call' },
              { icon: '💊', label: 'Digital Prescription' },
            ].map(f => (
              <div key={f.label} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{f.icon}</span>
                <span style={{ fontSize: '0.9rem', color: '#c4b5fd', fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Notice */}
      <section style={{ paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: 32, marginBottom: 48 }}>
            <h3 style={{ color: '#a5b4fc', marginBottom: 12 }}>🛡️ Your Privacy, Guaranteed</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.8 }}>
              When you book an anonymous session, your name is never revealed to the doctor. 
              You appear as a randomized session ID. Email notifications are sent but contain no identifying information. 
              Your prescription PDF will show "Anonymous Patient". Only you and the platform can link the session to your account.
            </p>
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: 32 }}>Available Psychiatrists</h2>

          {loading ? (
            <div className="page-loading"><div className="loading-spinner" /></div>
          ) : psychiatrists.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <h3>No psychiatrists available yet</h3>
              <p>Check back soon as we're adding more specialists</p>
            </div>
          ) : (
            <div className="grid-auto">
              {psychiatrists.map(d => (
                <div key={d.id} style={{ position: 'relative' }}>
                  <DoctorCard doctor={d} showBookButton={false} />
                  <div style={{ padding: '0 0 4px' }}>
                    <Link to={`/book/${d.id}?anonymous=true`} className="btn btn-primary btn-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', marginTop: 8 }}>
                      🔒 Book Anonymously
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Crisis Resources */}
      <section style={{ background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.15)', padding: '40px 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 700 }}>
          <h3 style={{ marginBottom: 8, color: '#fca5a5' }}>🆘 In Crisis? Get Immediate Help</h3>
          <p style={{ color: '#94a3b8', marginBottom: 12 }}>If you are in immediate danger, please contact emergency services</p>
          <p style={{ color: '#fca5a5', fontWeight: 700, fontSize: '1.2rem' }}>Sri Lanka Crisis Hotline: 1926</p>
        </div>
      </section>
    </div>
  );
}
