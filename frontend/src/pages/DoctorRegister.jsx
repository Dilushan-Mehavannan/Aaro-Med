import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = ['General', 'Cardiologist', 'Psychiatrist', 'Dermatologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Ophthalmologist', 'ENT', 'Gynecologist', 'Urologist', 'Oncologist'];

export default function DoctorRegister() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const hasToken = localStorage.getItem('sd_token');
    return hasToken ? 2 : 1;
  });
  const [form, setForm] = useState({
    specialization: 'General', qualification: '', clinicName: '', clinicAddress: '',
    consultationType: 'both', dailyLimit: 20,
    bookingFee: '', consultationFee: '',
    workingHoursStart: '08:00', workingHoursEnd: '17:00',
    sealName: '', signature: '', seal: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleFileChange = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      set(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential, role: 'doctor' });
      login(res.data.user, res.data.token, res.data.role);
      toast.success('Signed in! Continue with your registration.');
      setStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/doctor/register', {
        specialization: form.specialization,
        qualification: form.qualification,
        clinicName: form.clinicName,
        clinicAddress: form.clinicAddress,
        consultationType: form.consultationType,
        dailyLimit: form.dailyLimit,
        bookingFee: parseFloat(form.bookingFee) || 0,
        consultationFee: parseFloat(form.consultationFee) || 0,
        workingHoursStart: form.workingHoursStart,
        workingHoursEnd: form.workingHoursEnd,
        sealName: form.sealName,
        signature: form.signature,
        seal: form.seal,
      });
      setSubmitted(true);
      toast.success('Application submitted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 560, paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>📋</div>
          <h2>Application Submitted!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 12, marginBottom: 24 }}>
            Your doctor registration is under review. Our admin team will verify your information and notify you within 1-2 business days.
          </p>
          <div className="alert alert-info">📧 Check your email for a confirmation message</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 700, paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 8 }}>Doctor Registration</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Register your clinic on SmartDoctor and start accepting consultations</p>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {['Sign In', 'Professional Info', 'Settings', 'Review'].map((lbl, i) => (
            <div key={lbl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', marginBottom: 6,
                background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--bg-card)',
                border: `2px solid ${step >= i + 1 ? 'var(--primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'white'
              }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ fontSize: '0.72rem', color: step >= i + 1 ? 'var(--text-secondary)' : 'var(--text-muted)', textAlign: 'center' }}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Google Sign In */}
        {step === 1 && (
          <div className="glass-card slide-in" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>👨‍⚕️</div>
            <h3 style={{ marginBottom: 8 }}>Sign in with Google</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Use your Gmail account to get started</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast.error('Google login failed')} theme="filled_black" shape="pill" size="large" />
            </div>
          </div>
        )}

        {/* Step 2: Professional Info */}
        {step === 2 && (
          <div className="glass-card slide-in">
            <h3 style={{ marginBottom: 20 }}>Professional Information</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <select className="form-input" value={form.specialization} onChange={e => set('specialization', e.target.value)}>
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Qualification</label>
                <input className="form-input" value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="MBBS, MD, etc." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Clinic Name</label>
              <input className="form-input" value={form.clinicName} onChange={e => set('clinicName', e.target.value)} placeholder="e.g., City Medical Center" />
            </div>
            <div className="form-group">
              <label className="form-label">Clinic Address</label>
              <textarea className="form-input" value={form.clinicAddress} onChange={e => set('clinicAddress', e.target.value)} placeholder="Full address" style={{ minHeight: 70 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Seal Name (appears on PDF prescriptions)</label>
              <input className="form-input" value={form.sealName} onChange={e => set('sealName', e.target.value)} placeholder="e.g., Dr. John Smith MBBS" />
            </div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Digital Signature Image</label>
                <input type="file" accept="image/*" className="form-input" onChange={e => handleFileChange('signature', e.target.files[0])} />
                {form.signature && (
                  <img src={form.signature} alt="Signature Preview" style={{ maxHeight: 60, marginTop: 8, borderRadius: 6, background: '#fff', padding: 6, border: '1px solid var(--border)' }} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Official Stamp/Seal Image</label>
                <input type="file" accept="image/*" className="form-input" onChange={e => handleFileChange('seal', e.target.files[0])} />
                {form.seal && (
                  <img src={form.seal} alt="Seal Preview" style={{ maxHeight: 60, marginTop: 8, borderRadius: 6, background: '#fff', padding: 6, border: '1px solid var(--border)' }} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!localStorage.getItem('sd_token') && <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>}
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)} disabled={!form.qualification || !form.clinicName || !form.clinicAddress}>
                Next: Consultation Settings →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="glass-card slide-in">
            <h3 style={{ marginBottom: 20 }}>Consultation Settings</h3>
            <div className="form-group">
              <label className="form-label">Consultation Type</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[['online','📹 Online Only'], ['physical','🏥 Physical Only'], ['both','Both']].map(([val, lbl]) => (
                  <label key={val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: form.consultationType === val ? 'rgba(37,99,235,0.15)' : 'rgba(0,0,0,0.2)', border: `1px solid ${form.consultationType === val ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                    <input type="radio" name="ct" value={val} checked={form.consultationType === val} onChange={e => set('consultationType', e.target.value)} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Daily Patient Limit</label>
                <input type="number" className="form-input" value={form.dailyLimit} onChange={e => set('dailyLimit', e.target.value)} min={1} max={100} />
              </div>
              <div />
              <div className="form-group">
                <label className="form-label">Booking Fee (LKR)</label>
                <input type="number" className="form-input" value={form.bookingFee} onChange={e => set('bookingFee', e.target.value)} placeholder="e.g., 500" />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (LKR)</label>
                <input type="number" className="form-input" value={form.consultationFee} onChange={e => set('consultationFee', e.target.value)} placeholder="e.g., 1500" />
              </div>
              <div className="form-group">
                <label className="form-label">Working Hours Start</label>
                <input type="time" className="form-input" value={form.workingHoursStart} onChange={e => set('workingHoursStart', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Working Hours End</label>
                <input type="time" className="form-input" value={form.workingHoursEnd} onChange={e => set('workingHoursEnd', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(4)}>Review Application →</button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="glass-card slide-in">
            <h3 style={{ marginBottom: 20 }}>Review Your Application</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                ['Specialization', form.specialization],
                ['Qualification', form.qualification],
                ['Clinic', form.clinicName],
                ['Address', form.clinicAddress],
                ['Consultation Type', form.consultationType],
                ['Daily Limit', form.dailyLimit],
                ['Booking Fee', `LKR ${form.bookingFee}`],
                ['Consultation Fee', `LKR ${form.consultationFee}`],
                ['Working Hours', `${form.workingHoursStart} – ${form.workingHoursEnd}`],
                ['Seal Name', form.sealName],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="alert alert-info">Your application will be reviewed within 1-2 business days.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? '⏳ Submitting...' : '✅ Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
