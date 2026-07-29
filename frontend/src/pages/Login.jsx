import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token, res.data.role);
      toast.success(`Welcome back, ${res.data.user.name}`);
      
      // Redirect based on role
      if (res.data.role === 'admin') navigate('/admin');
      else if (['doctor', 'psychiatrist'].includes(res.data.role)) navigate('/doctor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential, role: 'patient' });
      login(res.data.user, res.data.token, res.data.role);
      toast.success(`Welcome back, ${res.data.user.name}`);
      
      if (res.data.role === 'admin') navigate('/admin');
      else if (['doctor', 'psychiatrist'].includes(res.data.role)) navigate('/doctor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px', paddingBottom: '40px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👋</div>
          <h2 style={{ margin: 0 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>Sign in to access your health dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              placeholder="name@example.com" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                placeholder="••••••••" 
                required 
                style={{ paddingRight: 40 }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginBottom: 16 }}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 12 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google login failed')}
            theme="outline"
            shape="pill"
            width="390"
          />
        </div>

        <div className="divider" style={{ margin: '20px 0' }} />
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>🚀 Quick Test — Bypass Google Auth</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => {
                setForm({ email: 'demo_patient@smartdoctor.com', password: 'password123' });
                // We'll simulate the response instead of relying on DB if needed, 
                // but let's assume the user has run the seed or we can just mock it.
                toast.success('Demo credentials loaded!');
              }} 
              className="btn btn-ghost btn-sm btn-full"
            >
              👤 Patient Demo
            </button>
            <button 
              onClick={() => {
                setForm({ email: 'demo_doctor@smartdoctor.com', password: 'password123' });
                toast.success('Demo credentials loaded!');
              }} 
              className="btn btn-ghost btn-sm btn-full"
            >
              👨‍⚕️ Doctor Demo
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create one here</Link>
        </div>
        
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
