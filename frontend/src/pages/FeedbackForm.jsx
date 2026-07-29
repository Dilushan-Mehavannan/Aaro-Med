import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const StarRating = ({ value, onChange, label }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div className="star-rating">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= value ? 'filled' : ''}`} onClick={() => onChange(i)}>★</span>
      ))}
    </div>
  </div>
);

const StarDisplay = ({ value, label }) => (
  <div className="form-group" style={{ marginBottom: 16 }}>
    <label className="form-label" style={{ fontWeight: 600 }}>{label}</label>
    <div className="star-rating" style={{ pointerEvents: 'none' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= value ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  </div>
);

export default function FeedbackForm() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [form, setForm] = useState({ rating: 0, comment: '', videoQuality: 0, easeOfUse: 0, reportedIssue: '', showReportIssue: false });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const res = await api.get(`/patient/consultations/${consultationId}`);
        setConsultation(res.data);
        if (res.data.feedback) {
          setExistingFeedback(res.data.feedback);
        }
      } catch (err) {
        console.error('Error fetching consultation:', err);
      }
    };
    fetchConsultation();
  }, [consultationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) { toast.error('Please provide an overall rating'); return; }
    setLoading(true);
    try {
      await api.post('/patient/feedback', {
        consultationId,
        rating: form.rating,
        comment: form.comment,
        videoQuality: form.videoQuality || null,
        easeOfUse: form.easeOfUse || null,
        reportedIssue: form.showReportIssue ? form.reportedIssue : null,
      });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setLoading(false); }
  };

  if (existingFeedback) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 600, paddingTop: 32, paddingBottom: 60 }}>
          <h1 style={{ marginBottom: 8 }}>Feedback Submitted</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>You have already submitted feedback for this consultation.</p>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StarDisplay value={existingFeedback.rating} label="Overall Doctor Rating" />
            
            {existingFeedback.video_quality > 0 && (
              <StarDisplay value={existingFeedback.video_quality} label="Video/Audio Quality" />
            )}
            
            {existingFeedback.ease_of_use > 0 && (
              <StarDisplay value={existingFeedback.ease_of_use} label="Ease of Using the Platform" />
            )}

            {existingFeedback.comment && (
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Comments</label>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                  {existingFeedback.comment}
                </div>
              </div>
            )}

            {existingFeedback.reported_issue && (
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#f87171' }}>Reported Technical Issue</label>
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {existingFeedback.reported_issue}
                </div>
              </div>
            )}

            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-full btn-lg" style={{ marginTop: 16 }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 500, paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>🌟</div>
          <h2>Thank You!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Your feedback helps us improve our services.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 600, paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 8 }}>Rate Your Experience</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Help us improve by sharing your feedback</p>

        <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StarRating value={form.rating} onChange={(v) => setForm({...form, rating: v})} label="Overall Doctor Rating *" />
          <StarRating value={form.videoQuality} onChange={(v) => setForm({...form, videoQuality: v})} label="Video/Audio Quality (if online)" />
          <StarRating value={form.easeOfUse} onChange={(v) => setForm({...form, easeOfUse: v})} label="Ease of Using the Platform" />

          <div className="form-group">
            <label className="form-label">Comments</label>
            <textarea className="form-input" value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} placeholder="Share your experience..." />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.showReportIssue} onChange={e => setForm({...form, showReportIssue: e.target.checked})} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Report a technical issue</span>
            </label>
          </div>

          {form.showReportIssue && (
            <div className="form-group">
              <label className="form-label">Describe the Issue</label>
              <textarea className="form-input" value={form.reportedIssue} onChange={e => setForm({...form, reportedIssue: e.target.value})} placeholder="What issue did you experience?" />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !form.rating}>
            {loading ? '⏳ Submitting...' : '⭐ Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
