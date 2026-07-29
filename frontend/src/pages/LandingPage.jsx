import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';
import toast from 'react-hot-toast';

const statusColor = { waiting: 'badge-primary', serving: 'badge-success', completed: 'badge-secondary', denied: 'badge-danger', pending: 'badge-warning' };

function LoginSection() {
  const { login, user, role } = useAuth();
  const navigate = useNavigate();
  const [roleSelect, setRoleSelect] = useState('patient');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential,
        role: roleSelect,
      });
      login(res.data.user, res.data.token, res.data.role);
      toast.success(`Welcome, ${res.data.user.name}!`);
      const r = res.data.role;
      if (r === 'admin') navigate('/admin');
      else if (r === 'doctor' || r === 'psychiatrist') navigate('/doctor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  if (user) return null;

  return (
    <div className="glass-card slide-in" style={{ maxWidth: 400, margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 6, fontSize: '1.2rem' }}>Sign in with Google</h3>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Secure, one-click authentication
      </p>
      <div className="form-group">
        <label className="form-label">I am signing in as</label>
        <select className="form-input" value={roleSelect} onChange={e => setRoleSelect(e.target.value)}>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google login failed')}
          theme="filled_black"
          shape="pill"
          size="large"
          text="signin_with"
        />

        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Or </span>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in with Email</Link>
        </div>
      </div>
      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Doctor? <Link to="/doctor/register">Register your clinic →</Link> &nbsp;|&nbsp;
        Admin? <Link to="/admin/login">Admin Login →</Link>
      </p>
    </div>
  );
}

export default function LandingPage() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'doctor' || role === 'psychiatrist') navigate('/doctor/dashboard');
      else navigate('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    api.get('/patient/doctors').then(res => setFeaturedDoctors(res.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', paddingTop: 80 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
              <span style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>🚀 Smart Healthcare Platform</span>
            </div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
              The Future of<br />
              <span className="gradient-text">Doctor Consultations</span>
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.7 }}>
              Book appointments instantly, track queues in real-time, conduct video consultations, and get digital prescriptions — all in one platform.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/doctors" className="btn btn-primary btn-lg">🔍 Find Doctors</Link>
              <Link to="/mental-health" className="btn btn-secondary btn-lg">🧠 Mental Health</Link>
            </div>
          </div>
          <div>
            <LoginSection />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 0', background: 'rgba(30,41,59,0.3)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get your consultation in 4 simple steps</p>
          </div>
          <div className="grid-4">
            {[
              { step: '01', icon: '🔍', title: 'Search Doctor', desc: 'Find specialists by name, specialization, or consultation type' },
              { step: '02', icon: '💳', title: 'Pay Booking Fee', desc: 'Secure payment via PayHere payment gateway (LKR)' },
              { step: '03', icon: '🎫', title: 'Get Token', desc: 'Receive your token number and track queue in real-time' },
              { step: '04', icon: '📹', title: 'Attend Consultation', desc: 'Online video call or physical visit with digital prescription' },
            ].map((item) => (
              <div key={item.step} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: 2, marginBottom: 12 }}>STEP {item.step}</div>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{item.icon}</div>
                <h4 style={{ marginBottom: 8 }}>{item.title}</h4>
                <p style={{ fontSize: '0.87rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mental Health Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 24, padding: 48,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧠</div>
              <h2 style={{ marginBottom: 12 }}>Private Mental Health Support</h2>
              <p style={{ marginBottom: 24, lineHeight: 1.7 }}>
                Your mental health matters. Book completely anonymous sessions with licensed psychiatrists. 
                Your identity is fully protected — no names, no traces, just healing.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {['🔒 100% Anonymous — identity never revealed', '📹 Online-only for complete privacy', '🛡️ End-to-end encrypted sessions'].map(f => (
                  <div key={f} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f}</div>
                ))}
              </div>
              <Link to="/mental-health" className="btn btn-primary btn-lg">Book Anonymously</Link>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8rem', lineHeight: 1 }}>🫂</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      {featuredDoctors.length > 0 && (
        <section style={{ padding: '80px 0', background: 'rgba(30,41,59,0.3)' }}>
          <div className="container">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="section-title">Featured Doctors</h2>
                <p className="section-subtitle">Top-rated specialists available now</p>
              </div>
              <Link to="/doctors" className="btn btn-secondary">View All →</Link>
            </div>
            <div className="grid-auto">
              {featuredDoctors.map(d => <DoctorCard key={d.id} doctor={d} />)}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '40px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>🏥 <span className="gradient-text">SmartDoctor</span></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hybrid Token & Consultation System · © 2024 SmartDoctor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
