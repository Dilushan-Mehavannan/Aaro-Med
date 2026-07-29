import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PaymentModal({ doctor, type, tokenId, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [step, setStep] = useState('confirm'); // confirm | card_details | success
  
  // Card states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const amount = type === 'booking' ? parseFloat(doctor?.booking_fee || 0) : parseFloat(doctor?.consultation_fee || 0);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    const sections = value.match(/.{1,4}/g);
    setCardNumber(sections ? sections.join(' ') : '');
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 4);
    if (value.length > 2) {
      setExpiry(`${value.substring(0, 2)}/${value.substring(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(value);
  };

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payment/initiate', {
        doctorId: doctor.id || doctor._id,
        type,
        tokenId: tokenId || null,
      });
      setPaymentId(res.data.payment.id);
      setStep('card_details');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSuccess = async () => {
    if (!cardName || cardNumber.replace(/\s/g, '').length !== 16 || expiry.length !== 5 || cvv.length !== 3) {
      toast.error('Please fill in all credit card details correctly');
      return;
    }
    setLoading(true);
    try {
      await api.post('/payment/demo-success', { paymentId });
      setStep('success');
      toast.success('Payment successful! (Demo Mode)');
      setTimeout(() => onSuccess && onSuccess(paymentId), 850);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>
            {type === 'booking' ? '💳 Pay Booking Fee' : '💊 Pay Consultation Fee'}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>
            <strong>Secure checkout</strong> · Demo Sandbox Mode
          </span>
        </div>

        {step === 'confirm' && (
          <>
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Doctor</span>
                <span style={{ fontWeight: 600 }}>{doctor?.user?.name || doctor?.name || 'Doctor'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Type</span>
                <span className="badge badge-info">{type === 'booking' ? 'Booking Fee' : 'Consultation Fee'}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Amount</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary-light)' }}>LKR {amount.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleInitiate} disabled={loading}>
              {loading ? '⏳ Processing...' : '💳 Proceed to Card Payment'}
            </button>
          </>
        )}

        {step === 'card_details' && (
          <form onSubmit={(e) => { e.preventDefault(); handleDemoSuccess(); }}>
            {/* Visual Card Preview */}
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              color: '#f8fafc',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', letterSpacing: 2, color: 'var(--primary-light)', fontWeight: 700 }}>CREDIT CARD</span>
                <span style={{ fontSize: '1.5rem' }}>💳</span>
              </div>
              <div style={{ fontSize: '1.25rem', letterSpacing: 3, fontFamily: 'monospace', margin: '12px 0' }}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                <div style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginBottom: 2 }}>Cardholder</div>
                  <div>{cardName || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginBottom: 2 }}>Expires</div>
                  <div>{expiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Cardholder Name</label>
              <input
                type="text"
                className="form-input"
                required
                value={cardName}
                onChange={e => setCardName(e.target.value.toUpperCase())}
                placeholder="JOHN DOE"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Card Number</label>
              <input
                type="text"
                className="form-input"
                required
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4111 2222 3333 4444"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Expiry Date</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">CVV</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="•••"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? '⏳ Processing Payment...' : `💳 Pay LKR ${amount.toFixed(2)}`}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>✅</div>
            <h4 style={{ color: 'var(--success)', marginBottom: 8 }}>Payment Successful!</h4>
            <p style={{ color: 'var(--text-muted)' }}>Your payment has been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
