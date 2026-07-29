import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', form);
      login(res.data.user, res.data.token, 'admin');
      toast.success('Admin logged in');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px', paddingBottom: '40px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔐</div>
          <h2 style={{ margin: 0 }}>Admin Login</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>SmartDoctor Administration Panel</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" id="admin-email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="admin@smartdoctor.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="admin-password" 
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
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 10 }}>
            {loading ? '⏳ Logging in...' : '🔐 Login to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
