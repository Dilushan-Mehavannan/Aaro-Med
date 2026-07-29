import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import PaymentModal from '../components/PaymentModal';
import toast from 'react-hot-toast';

export default function PrescriptionPage() {
  const { prescriptionId } = useParams();
  const { socket } = useSocket();
  const [prescription, setPrescription] = useState(null);
  const [locked, setLocked] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchPrescription = async () => {
    try {
      const res = await api.get(`/patient/prescriptions/${prescriptionId}`);
      setPrescription(res.data);
      setLocked(res.data.is_locked);
      setDoctor(res.data.doctor);
      setTokenId(res.data.consultation?.token_id);
    } catch (err) {
      if (err.response?.status === 402) {
        setLocked(true);
        if (err.response.data.doctor) {
          setDoctor(err.response.data.doctor);
        }
        if (err.response.data.tokenId) {
          setTokenId(err.response.data.tokenId);
        }
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPrescription();
    if (socket) {
      socket.on('prescription:unlocked', ({ prescriptionId: pid }) => {
        if (pid === prescriptionId) { setLocked(false); fetchPrescription(); toast.success('Prescription unlocked!'); }
      });
      return () => socket.off('prescription:unlocked');
    }
  }, [socket, prescriptionId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/patient/prescriptions/${prescriptionId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Prescription downloaded!');
    } catch { toast.error('Download failed'); } finally { setDownloading(false); }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  if (locked) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 500, paddingTop: 60, textAlign: 'center' }}>
          <div className="glass-card">
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔒</div>
            <h2 style={{ marginBottom: 8 }}>Prescription Locked</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Pay the consultation fee to unlock your prescription and download the PDF.
            </p>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setShowPayment(true)}>💳 Pay Consultation Fee</button>
            <Link to="/dashboard" className="btn btn-ghost btn-full" style={{ marginTop: 10 }}>← Back to Dashboard</Link>
          </div>
        </div>
        {showPayment && doctor && (
          <PaymentModal
            doctor={doctor}
            type="consultation"
            tokenId={tokenId}
            onSuccess={() => { setShowPayment(false); }}
            onClose={() => setShowPayment(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 60 }}>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-block', marginBottom: 24 }}>← Back to Dashboard</Link>

        <div className="glass-card">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>℞</div>
              <h2 style={{ margin: 0 }}>Dr. {prescription?.doctor?.user?.name}</h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0' }}>{prescription?.doctor?.specialization}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>🏥 {prescription?.doctor?.clinic_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success">✓ Verified</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                {new Date(prescription?.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Medicines */}
          <h4 style={{ marginBottom: 14 }}>Prescribed Medicines</h4>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th><th>Dosage</th><th>Duration</th><th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {(prescription?.medicines || []).map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.dosage}</td>
                    <td>{m.duration}</td>
                    <td>{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {prescription?.notes && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 14, marginBottom: 24 }}>
              <strong>📝 Doctor's Notes: </strong>{prescription.notes}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary btn-lg" onClick={handleDownload} disabled={downloading}>
              {downloading ? '⏳ Generating PDF...' : '📄 Download PDF'}
            </button>
            <Link to={`/feedback/${prescription?.consultation_id?._id || prescription?.consultation_id}`} className="btn btn-secondary">⭐ Give Feedback</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
