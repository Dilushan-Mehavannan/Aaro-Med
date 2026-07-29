import { useState, useEffect } from 'react';
import { useAuthStore, useToastStore } from '../store/index.js';
import { paymentService, tokenService } from '../services/api.js';

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' };
const btn = (color = '#0ea5e9') => ({ background: color, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' });
const badge = (status) => {
  const colors = { completed: '#10b981', pending: '#f59e0b', failed: '#ef4444', booking_paid: '#0ea5e9', fully_paid: '#10b981' };
  return { display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: (colors[status] || '#94a3b8') + '22', color: colors[status] || '#94a3b8' };
};

export default function PaymentPage() {
  const { currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [tokens, setTokens] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paying, setPaying] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (currentUser) { loadData(); } }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tokensRes, paymentsRes] = await Promise.all([
        tokenService.getMyTokens(),
        paymentService.getMyPayments(),
      ]);
      setTokens(tokensRes.data);
      setPayments(paymentsRes.data);
    } catch { addToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  const handlePay = async (tokenId, paymentType) => {
    setPaying(`${tokenId}-${paymentType}`);
    try {
      const r = await paymentService.initiatePayment({ tokenId, paymentType });
      const params = r.data.payhereParams;

      // In sandbox/demo, simulate by showing payment details
      if (params.sandbox) {
        // Demo: auto-mark as paid for development
        await paymentService.markManualPayment({ tokenId, paymentType });
        addToast(`Payment of Rs. ${params.amount} recorded (Demo mode)`, 'success');
        loadData();
      }
    } catch (e) { addToast(e.response?.data?.error || 'Payment failed', 'error'); }
    finally { setPaying(null); }
  };

  const activeTokens = tokens.filter(t => t.status === 'pending' || t.status === 'active');
  const completedTokens = tokens.filter(t => t.status === 'completed');

  if (!currentUser) return (
    <div style={{ paddingTop: 80, textAlign: 'center', padding: '80px 1rem' }}>
      <p>Please log in to view your payments.</p>
    </div>
  );

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)', padding: '80px 1rem 2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Payments</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Manage your booking and consultation fee payments</p>

        {/* PayHere info */}
        <div style={{ ...card, background: '#0ea5e911', border: '1px solid #0ea5e9', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💳</span>
            <div>
              <div style={{ fontWeight: 700 }}>Secure Payments via PayHere</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>All payments are processed securely via PayHere, Sri Lanka's trusted payment gateway. Accepts cards, online banking and mobile payments.</div>
            </div>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Loading…</p> : (
          <>
            {/* Pending payments */}
            {activeTokens.length > 0 && (
              <div style={card}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>💰 Outstanding Payments</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeTokens.map(t => (
                    <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>Token #{t.tokenNumber} — {t.doctorName}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{t.specialty} • {t.consultationMode}</div>
                          <span style={badge(t.paymentStatus || 'pending')}>{t.paymentStatus || 'pending'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {(!t.paymentStatus || t.paymentStatus === 'pending') && (
                            <button onClick={() => handlePay(t.id, 'booking')} disabled={paying === `${t.id}-booking`}
                              style={btn('#f59e0b')}>
                              {paying === `${t.id}-booking` ? '…' : `Pay Booking Rs. ${t.bookingFee}`}
                            </button>
                          )}
                          {t.paymentStatus === 'booking_paid' && (
                            <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>✅ Booking paid</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed payments to pay consultation fee */}
            {completedTokens.filter(t => t.paymentStatus !== 'fully_paid').length > 0 && (
              <div style={card}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🏥 Consultation Fees Due</h3>
                {completedTokens.filter(t => t.paymentStatus !== 'fully_paid').map(t => (
                  <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{t.doctorName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{new Date(t.bookingDate).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => handlePay(t.id, 'consultation')} disabled={paying === `${t.id}-consultation`}
                        style={btn('#0ea5e9')}>
                        {paying === `${t.id}-consultation` ? '…' : `Pay Rs. ${t.consultationFee}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment history */}
            <div style={card}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 Payment History</h3>
              {payments.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>No payment history yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {payments.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{p.paymentType === 'booking' ? 'Booking Fee' : 'Consultation Fee'}</span>
                        <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 700 }}>Rs. {p.amount}</span>
                        <span style={badge(p.status)}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
