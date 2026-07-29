import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRole = params.get('role') === 'doctor' ? 'doctor' : 'patient';
    return {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: initialRole
    };
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'patient' || roleParam === 'doctor') {
      setForm(prev => ({ ...prev, role: roleParam }));
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      });
      
      login(res.data.user, res.data.token, res.data.role);
      toast.success('Account created successfully!');
      if (res.data.role === 'doctor') {
        navigate('/doctor/register');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 40px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>✨</div>
          <h2 style={{ margin: 0 }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>Join SmartDoctor for easier consultations</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">I want to register as a</label>
            <select 
              className="form-input" 
              value={form.role} 
              onChange={e => setForm({...form, role: e.target.value})}
              style={{ cursor: 'pointer' }}
            >
              {(() => {
                const params = new URLSearchParams(window.location.search);
                const roleParam = params.get('role');
                return (
                  <>
                    {(!roleParam || roleParam === 'patient') && (
                      <option value="patient">Patient (Seek Consultation)</option>
                    )}
                    {(!roleParam || roleParam === 'doctor') && (
                      <option value="doctor">Doctor (Offer Consultation)</option>
                    )}
                  </>
                );
              })()}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="John Doe" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              placeholder="john@example.com" 
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
                minLength={6}
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
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                className="form-input" 
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                placeholder="••••••••" 
                required 
                style={{ paddingRight: 40 }}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? '⏳ Creating Account...' : 'Create Account ✨'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
