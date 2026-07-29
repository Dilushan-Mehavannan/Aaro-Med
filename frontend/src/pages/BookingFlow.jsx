import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

export default function BookingFlow({ isAnonymous: forceAnonymous = false }) {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode');
  const navigate = useNavigate();
  const { socket, joinQueueRoom } = useSocket();

  const [step, setStep] = useState(1); // 1=mode, 2=payment, 3=token
  const [doctor, setDoctor] = useState(null);
  const [mode, setMode] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAnonymous] = useState(forceAnonymous);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/patient/doctors/${doctorId}`).then(res => {
      setDoctor(res.data);
      if (initialMode && (initialMode === 'online' || initialMode === 'physical')) {
        setMode(initialMode);
      } else if (res.data.consultation_type === 'online') setMode('online');
      else if (res.data.consultation_type === 'physical') setMode('physical');
    }).catch(() => toast.error('Doctor not found'));
  }, [doctorId, initialMode]);

  const handlePaymentSuccess = async (pId) => {
    setPaymentId(pId);
    setShowPaymentModal(false);
    setStep(3);
    toast.success('Payment confirmed! Confirming your booking...');
    // Auto-create token after payment
    await createToken();
  };

  const createToken = async () => {
    setLoading(true);
    try {
      const res = await api.post('/patient/tokens', {
        doctorId,
        consultationMode: mode,
        isAnonymous,
      });
      setTokenData(res.data);
      joinQueueRoom(doctorId);
      toast.success(`Token #${res.data.token.token_number} created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Ensure payment is complete.');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 700, paddingTop: 32, paddingBottom: 48 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
          {['Select Mode', 'Pay Booking Fee', 'Token Confirmed'].map((lbl, i) => (
            <div key={lbl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--bg-card)',
                border: `2px solid ${step >= i + 1 ? 'var(--primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 700, marginBottom: 6, color: 'white',
                transition: 'all 0.3s'
              }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ fontSize: '0.75rem', color: step >= i + 1 ? 'var(--text-secondary)' : 'var(--text-muted)', textAlign: 'center' }}>{lbl}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>👨‍⚕️</span>
            <div>
              <div style={{ fontWeight: 700 }}>Dr. {doctor.user?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doctor.specialization} · {doctor.clinic_name}</div>
            </div>
          </div>
        </div>

        {/* Step 1: Mode */}
        {step === 1 && (
          <div className="slide-in">
            <h2 style={{ marginBottom: 24 }}>Choose Consultation Mode</h2>
            {isAnonymous && (
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                🔒 Anonymous session — Online only for complete privacy
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: (initialMode === 'online' || initialMode === 'physical') ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              {(!initialMode || initialMode === 'online' || initialMode === 'both') && (doctor.consultation_type === 'online' || doctor.consultation_type === 'both') && (
                <div className="glass-card" onClick={() => setMode('online')} style={{ cursor: 'pointer', border: `2px solid ${mode === 'online' ? 'var(--primary)' : 'var(--glass-border)'}`, textAlign: 'center', padding: 28 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📹</div>
                  <h4>Online Video Call</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Consult from anywhere</p>
                  {mode === 'online' && <div style={{ color: 'var(--primary-light)', fontWeight: 700, marginTop: 8 }}>✓ Selected</div>}
                </div>
              )}
              {!isAnonymous && (!initialMode || initialMode === 'physical' || initialMode === 'both') && (doctor.consultation_type === 'physical' || doctor.consultation_type === 'both') && (
                <div className="glass-card" onClick={() => setMode('physical')} style={{ cursor: 'pointer', border: `2px solid ${mode === 'physical' ? 'var(--primary)' : 'var(--glass-border)'}`, textAlign: 'center', padding: 28 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏥</div>
                  <h4>Physical Visit</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{doctor.clinic_name}</p>
                  {mode === 'physical' && <div style={{ color: 'var(--primary-light)', fontWeight: 700, marginTop: 8 }}>✓ Selected</div>}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Booking Fee</span>
                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>LKR {parseFloat(doctor.booking_fee || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consultation Fee (later)</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>LKR {parseFloat(doctor.consultation_fee || 0).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={() => mode && setStep(2)} disabled={!mode}>
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="slide-in">
            <h2 style={{ marginBottom: 24 }}>Pay Booking Fee</h2>
            <div className="glass-card" style={{ textAlign: 'center', padding: 40, marginBottom: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>💳</div>
              <h3 style={{ marginBottom: 4 }}>LKR {parseFloat(doctor.booking_fee || 0).toFixed(2)}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>One-time booking fee to reserve your slot</p>
              <span className="sandbox-tag">Demo Payment — Sandbox Mode</span>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setShowPaymentModal(true)}>
              💳 Pay with PayHere
            </button>
            <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setStep(1)}>← Back</button>
          </div>
        )}

        {/* Step 3: Confirmed */}
        {step === 3 && (
          <div className="slide-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: 16 }}>🎉</div>
            {loading ? (
              <div><div className="loading-spinner" /><p>Creating your token...</p></div>
            ) : tokenData ? (
              <>
                <h2 style={{ marginBottom: 8 }}>Booking Confirmed!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Your consultation has been booked successfully</p>
                <div className="glass-card" style={{ display: 'inline-block', padding: 32, marginBottom: 32 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your Token</div>
                  <div className="queue-number">#{tokenData.token?.token_number}</div>
                  <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                    Dr. {doctor.user?.name} · {mode === 'online' ? '📹 Online' : '🏥 Physical'}
                  </div>
                  {tokenData.token?.queue_position && (
                    <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                      Queue position: #{tokenData.token.queue_position} · ~{tokenData.token.queue_position * 10} min wait
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
                  <Link to={`/queue/${doctorId}`} className="btn btn-primary">Track Queue →</Link>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          doctor={doctor}
          type="booking"
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
