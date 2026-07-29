import { useState, useEffect } from 'react';
import { useAuthStore, useToastStore } from '../store/index.js';
import { feedbackService, tokenService } from '../services/api.js';

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' };
const inp = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' };
const btn = (color = '#0ea5e9') => ({ background: color, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' });

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.3rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={() => onChange(n)} style={{ fontSize: '2rem', cursor: 'pointer', color: n <= value ? '#f59e0b' : '#d1d5db', transition: 'color 0.1s' }}>★</span>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState('feedback');
  const [tokens, setTokens] = useState([]);
  const [form, setForm] = useState({ tokenId: '', doctorId: '', rating: 0, comment: '' });
  const [issueForm, setIssueForm] = useState({ issueType: 'video', description: '' });
  const [submitted, setSubmitted] = useState(false);
  const [issueSubmitted, setIssueSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'patient') loadTokens();
  }, [currentUser]);

  const loadTokens = async () => {
    try {
      const r = await tokenService.getMyTokens();
      const completed = r.data.filter(t => t.status === 'completed');
      setTokens(completed);
    } catch {}
  };

  const handleTokenSelect = (tokenId) => {
    const token = tokens.find(t => t.id === tokenId);
    setForm(f => ({ ...f, tokenId, doctorId: token?.doctorId || '' }));
  };

  const handleSubmitFeedback = async () => {
    if (!form.doctorId || form.rating < 1) { addToast('Please select a consultation and give a rating', 'error'); return; }
    setLoading(true);
    try {
      await feedbackService.submitFeedback(form);
      setSubmitted(true);
      addToast('Thank you for your feedback!', 'success');
    } catch (e) { addToast(e.response?.data?.error || 'Failed to submit feedback', 'error'); }
    finally { setLoading(false); }
  };

  const handleSubmitIssue = async () => {
    if (!issueForm.description) { addToast('Please describe the issue', 'error'); return; }
    setLoading(true);
    try {
      await feedbackService.submitIssueReport(issueForm);
      setIssueSubmitted(true);
      addToast('Issue report submitted!', 'success');
    } catch { addToast('Failed to submit report', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)', padding: '80px 1rem 2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Feedback & Support</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Rate your experience and report issues</p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[['feedback', '⭐ Rate Doctor'], ['issue', '🐛 Report Issue']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t ? '#0ea5e9' : 'transparent'), color: tab === t ? '#fff' : 'var(--text)', border: tab === t ? 'none' : '1px solid var(--border)' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'feedback' && (
          <div style={card}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem' }}>🎉</div>
                <h3 style={{ marginTop: '1rem', fontWeight: 700 }}>Thank you for your feedback!</h3>
                <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Your rating helps other patients find the best doctors.</p>
                <button onClick={() => { setSubmitted(false); setForm({ tokenId: '', doctorId: '', rating: 0, comment: '' }); }} style={{ ...btn('#0ea5e9'), marginTop: '1rem' }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Rate Your Consultation</h3>

                {currentUser?.role === 'patient' && tokens.length > 0 ? (
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Consultation</label>
                    <select value={form.tokenId} onChange={e => handleTokenSelect(e.target.value)} style={{ ...inp, marginTop: 4 }}>
                      <option value="">Choose a completed consultation…</option>
                      {tokens.map(t => (
                        <option key={t.id} value={t.id}>{t.doctorName} — {new Date(t.bookingDate).toLocaleDateString()}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                    {currentUser ? 'No completed consultations found to rate.' : 'Please log in to submit feedback.'}
                  </p>
                )}

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Rating</label>
                  <div style={{ marginTop: '0.5rem' }}>
                    <StarRating value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Share Your Experience (optional)</label>
                  <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={4} placeholder="How was your experience with the doctor?" style={{ ...inp, marginTop: 4, resize: 'vertical' }} />
                </div>

                <button onClick={handleSubmitFeedback} disabled={loading || !currentUser} style={btn('#0ea5e9')}>
                  {loading ? 'Submitting…' : '⭐ Submit Rating'}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'issue' && (
          <div style={card}>
            {issueSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem' }}>✅</div>
                <h3 style={{ marginTop: '1rem', fontWeight: 700 }}>Issue Reported!</h3>
                <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Our support team will investigate and get back to you.</p>
                <button onClick={() => { setIssueSubmitted(false); setIssueForm({ issueType: 'video', description: '' }); }} style={{ ...btn('#6b7280'), marginTop: '1rem' }}>
                  Report Another Issue
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Report a Technical Issue</h3>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Issue Type</label>
                  <select value={issueForm.issueType} onChange={e => setIssueForm(f => ({ ...f, issueType: e.target.value }))} style={{ ...inp, marginTop: 4 }}>
                    <option value="video">Video Problem</option>
                    <option value="audio">Audio Problem</option>
                    <option value="connection">Connection Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="booking">Booking Issue</option>
                    <option value="prescription">Prescription Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description *</label>
                  <textarea value={issueForm.description} onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))} rows={5}
                    placeholder="Please describe the issue in detail. Include any error messages you saw." style={{ ...inp, marginTop: 4, resize: 'vertical' }} />
                </div>

                <button onClick={handleSubmitIssue} disabled={loading || !currentUser} style={btn('#ef4444')}>
                  {loading ? 'Submitting…' : '🐛 Submit Report'}
                </button>
                {!currentUser && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Please log in to submit an issue report.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
