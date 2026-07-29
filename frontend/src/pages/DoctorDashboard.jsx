import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusColor = { waiting: 'badge-primary', serving: 'badge-success', completed: 'badge-secondary', denied: 'badge-danger', pending: 'badge-warning' };

function PrescriptionForm({ consultationId, doctor, onSubmit }) {
  const hasSignature = !!doctor?.signature;
  const hasSeal = !!doctor?.seal;

  if (!hasSignature || !hasSeal) {
    return (
      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <h5 style={{ marginBottom: 12, color: 'var(--danger)' }}>⚠️ Signature & Stamp Required</h5>
        <div className="alert alert-danger" style={{ fontSize: '0.85rem', marginBottom: 12, lineHeight: '1.4' }}>
          You must upload your <strong>Digital Signature</strong> and <strong>Official Stamp/Seal</strong> in the <strong>Settings</strong> tab before you can issue prescriptions.
        </div>
      </div>
    );
  }

  const [prescriptionType, setPrescriptionType] = useState('write'); // 'write' or 'upload'
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '', instructions: '' }]);
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState('');
  const [loading, setLoading] = useState(false);

  const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', duration: '', instructions: '' }]);
  const removeMedicine = (i) => setMedicines(medicines.filter((_, idx) => idx !== i));
  const updateMedicine = (i, k, v) => setMedicines(medicines.map((m, idx) => idx === i ? {...m, [k]: v} : m));

  const handleFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFile(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (prescriptionType === 'upload' && !uploadedFile) {
        toast.error('Please select a file to upload');
        setLoading(false);
        return;
      }
      await api.post('/doctor/prescriptions', { 
        consultationId, 
        medicines: prescriptionType === 'write' ? medicines : [], 
        notes: prescriptionType === 'write' ? notes : 'Uploaded Prescription File',
        uploadedPrescription: prescriptionType === 'upload' ? uploadedFile : null
      });
      toast.success('Prescription issued!');
      onSubmit();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to issue prescription'); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <h5 style={{ marginBottom: 12, color: 'var(--success)' }}>💊 Issue Prescription</h5>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button 
          type="button" 
          className={`btn btn-sm ${prescriptionType === 'write' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setPrescriptionType('write')}
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          ✍️ Write Prescription
        </button>
        <button 
          type="button" 
          className={`btn btn-sm ${prescriptionType === 'upload' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setPrescriptionType('upload')}
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          📁 Upload PDF/Image
        </button>
      </div>

      {prescriptionType === 'write' ? (
        <>
          {medicines.map((m, i) => (
            <div key={i} className="grid-auto" style={{ gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px dashed var(--border)' }}>
              <input className="form-input" value={m.name} onChange={e => updateMedicine(i, 'name', e.target.value)} placeholder="Medicine name" style={{ fontSize: '0.85rem', padding: '8px 10px' }} />
              <input className="form-input" value={m.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} placeholder="Dosage (e.g. 500mg)" style={{ fontSize: '0.85rem', padding: '8px 10px' }} />
              <input className="form-input" value={m.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} placeholder="Duration (e.g. 5 days)" style={{ fontSize: '0.85rem', padding: '8px 10px' }} />
              <input className="form-input" value={m.instructions} onChange={e => updateMedicine(i, 'instructions', e.target.value)} placeholder="Instructions (e.g. After meals)" style={{ fontSize: '0.85rem', padding: '8px 10px' }} />
              <button type="button" className="btn btn-danger btn-sm btn-full" onClick={() => removeMedicine(i)} style={{ padding: '8px 10px' }}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addMedicine} style={{ marginBottom: 12 }}>+ Add Medicine</button>
          <div className="form-group">
            <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." style={{ minHeight: 60, fontSize: '0.85rem' }} />
          </div>
        </>
      ) : (
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Select Prescription File (PDF or Image)</label>
          <input 
            type="file" 
            accept="application/pdf, image/*" 
            className="form-input" 
            onChange={e => handleFileChange(e.target.files[0])} 
            style={{ fontSize: '0.85rem' }}
          />
          {uploadedFile && (
            <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--success)' }}>
              {uploadedFile.startsWith('data:application/pdf') ? (
                <span>📄 PDF Prescription Loaded successfully</span>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <span>🖼️ Image Preview:</span>
                  <img src={uploadedFile} alt="Prescription preview" style={{ display: 'block', maxHeight: 150, marginTop: 6, borderRadius: 6, border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn btn-success btn-sm" disabled={loading}>
        {loading ? '⏳ Issuing...' : '✅ Issue Prescription'}
      </button>
    </form>
  );
}

function TokenQueueCard({ token, doctor, onAction, onRefresh }) {
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [startedConsultation, setStartedConsultation] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const handleStart = async () => {
    try {
      const res = await api.post('/doctor/consultation/start', { consultationId: token.consultation?.id });
      if (token.consultation_mode === 'online') {
        setVideoUrl(res.data.video_room_url);
        setStartedConsultation(true);
        if (res.data.video_room_url) {
          window.open(res.data.video_room_url, '_blank');
        }
      } else {
        setStartedConsultation(true);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start'); }
  };

  const handleEnd = async () => {
    try {
      await api.post('/doctor/consultation/end', { consultationId: token.consultation?.id });
      setShowPrescriptionForm(true);
      toast.success('Consultation ended. Please issue prescription.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to end'); }
  };

  return (
    <div className="glass-card" style={{ borderLeft: `3px solid ${token.status === 'serving' ? 'var(--success)' : token.status === 'completed' ? 'var(--text-muted)' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>#{token.token_number}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{token.patientName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(token.booking_time).toLocaleTimeString()}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span className={`badge ${statusColor[token.status] || 'badge-secondary'}`}>{token.status}</span>
          <span className={`badge ${token.consultation_mode === 'online' ? 'badge-info' : 'badge-secondary'}`}>
            {token.consultation_mode === 'online' ? '📹' : '🏥'} {token.consultation_mode}
          </span>
          {token.is_anonymous && <span className="badge badge-warning">🔒 Anon</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {token.status === 'waiting' && (
          <>
            <button className="btn btn-success btn-sm" onClick={() => onAction('next', token.id)}>▶ Call Next</button>
          </>
        )}
        {token.status === 'pending' && (
          <>
            <button className="btn btn-success btn-sm" onClick={() => onAction('accept', token.id)}>✓ Accept</button>
            <button className="btn btn-danger btn-sm" onClick={() => onAction('deny', token.id)}>✗ Deny</button>
          </>
        )}
        {token.status === 'serving' && !showPrescriptionForm && (
          <>
            {!startedConsultation && (
              <button className="btn btn-primary btn-sm" onClick={handleStart}>
                {token.consultation_mode === 'online' ? '📹 Start Video Call' : '▶ Start Consultation'}
              </button>
            )}
            {startedConsultation && (
              <button className="btn btn-danger btn-sm" onClick={handleEnd}>🔴 End Consultation</button>
            )}
            {videoUrl && token.consultation_mode === 'online' && (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📹 Open Video</a>
            )}
          </>
        )}
      </div>

      {showPrescriptionForm && !token.consultation?.prescription && (
        <PrescriptionForm consultationId={token.consultation?.id} doctor={doctor} onSubmit={() => { setShowPrescriptionForm(false); onRefresh(); }} />
      )}
      {token.consultation?.prescription && (
        <div style={{ marginTop: 10 }} className="alert alert-success">✅ Prescription issued</div>
      )}
    </div>
  );
}

export default function DoctorDashboard() {
  const { user, fetchMe } = useAuth();
  const [tab, setTab] = useState('queue');
  const [data, setData] = useState({ queue: [], stats: {}, doctor: null });
  const [settings, setSettings] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/doctor/dashboard');
      setData(res.data);
      if (res.data.doctor) {
        setSettings({
          consultationType: res.data.doctor.consultation_type,
          dailyLimit: res.data.doctor.daily_limit,
          bookingFee: res.data.doctor.booking_fee,
          consultationFee: res.data.doctor.consultation_fee,
          workingHoursStart: res.data.doctor.working_hours_start,
          workingHoursEnd: res.data.doctor.working_hours_end,
          sealName: res.data.doctor.seal_name || '',
          signature: res.data.doctor.signature || '',
          seal: res.data.doctor.seal || '',
          profilePic: user?.profile_pic || '',
        });
      }
    } catch (err) {
      console.error('[ERROR] fetchDashboard:', err);
    } finally { setLoading(false); }
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const fetchFeedback = async () => {
    try { 
      const res = await api.get('/doctor/feedback'); 
      setFeedbacks(res.data); 
    } catch (err) {
      console.error('[ERROR] fetchFeedback:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/doctor/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('[ERROR] fetchNotifications:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
    if (socket) {
      socket.on('queue:updated', fetchDashboard);
      return () => socket.off('queue:updated');
    }
  }, [socket]);

  useEffect(() => {
    if (tab === 'feedback') fetchFeedback();
    if (tab === 'notifications') fetchNotifications();
  }, [tab]);

  const handleAction = async (action, tokenId) => {
    try {
      if (action === 'accept') await api.put(`/doctor/tokens/${tokenId}/accept`);
      else if (action === 'deny') await api.put(`/doctor/tokens/${tokenId}/deny`);
      else if (action === 'next') await api.put(`/doctor/tokens/${tokenId}/next`);
      toast.success(`Token ${action}ed`);
      fetchDashboard();
    } catch (err) { toast.error(err.response?.data?.message || `Action failed`); }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/doctor/settings', settings);
      await api.put('/auth/profile', { profilePic: settings.profilePic });
      await fetchMe();
      toast.success('Settings updated!');
      fetchDashboard();
    } catch { toast.error('Update failed'); }
  };

  const Stars = ({ v }) => <span style={{ color: 'var(--warning)' }}>{'★'.repeat(v)}{'☆'.repeat(5-v)}</span>;

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  const serving = data.queue.find(t => t.status === 'serving');

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Doctor Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="grid-4" style={{ gap: 12 }}>
            {[['📋', data.stats.total || 0, 'Total'], ['✅', data.stats.completed || 0, 'Done'], ['⏳', data.stats.pending || 0, 'Waiting'], ['🔵', data.stats.serving || 0, 'Serving']].map(([ic, v, l]) => (
              <div key={l} style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[['queue','🗂️ Queue'], ['settings','⚙️ Settings'], ['feedback','⭐ Feedback'], ['notifications','🔔 Notifications'], ['support','🆘 Support']].map(([t, lbl]) => {
            const isNotifications = t === 'notifications';
            const unreadCount = isNotifications ? notifications.filter(n => !n.is_read).length : 0;
            return (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); if (isNotifications) fetchNotifications(); }} style={{ position: 'relative' }}>
                {lbl}
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: -6, 
                    right: -6, 
                    background: 'var(--danger)', 
                    color: 'white', 
                    borderRadius: '50%', 
                    padding: '2px 6px', 
                    fontSize: '0.65rem', 
                    fontWeight: 800,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === 'queue' && (
          <div>
            {serving && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>🟢 Currently Serving: Token #{serving.token_number}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{serving.patientName}</span>
              </div>
            )}
            {data.queue.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🗂️</div><h3>No patients today</h3><p>Queue is empty</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.queue.map(t => (
                  <TokenQueueCard key={t.id || t._id} token={t} doctor={data.doctor} onAction={handleAction} onRefresh={fetchDashboard} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <form onSubmit={handleSettingsSave} className="glass-card" style={{ maxWidth: 600 }}>
            <h3 style={{ marginBottom: 20 }}>Consultation Settings</h3>
            <div className="form-group">
              <label className="form-label">Consultation Type</label>
              <select className="form-input" value={settings.consultationType} onChange={e => setSettings({...settings, consultationType: e.target.value})}>
                <option value="online">Online Only</option>
                <option value="physical">Physical Only</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Daily Limit</label>
                <input type="number" className="form-input" value={settings.dailyLimit} onChange={e => setSettings({...settings, dailyLimit: e.target.value})} />
              </div>
              <div />
              <div className="form-group">
                <label className="form-label">Booking Fee (LKR)</label>
                <input type="number" className="form-input" value={settings.bookingFee} onChange={e => setSettings({...settings, bookingFee: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (LKR)</label>
                <input type="number" className="form-input" value={settings.consultationFee} onChange={e => setSettings({...settings, consultationFee: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-input" value={settings.workingHoursStart} onChange={e => setSettings({...settings, workingHoursStart: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="time" className="form-input" value={settings.workingHoursEnd} onChange={e => setSettings({...settings, workingHoursEnd: e.target.value})} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Seal Name</label>
              <input type="text" className="form-input" value={settings.sealName} onChange={e => setSettings({...settings, sealName: e.target.value})} placeholder="e.g. Dr. John Smith MBBS" />
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Profile Picture</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {settings.profilePic ? (
                  <img src={settings.profilePic} alt="Profile Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                    {user?.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                )}
                <input type="file" accept="image/*" className="form-input" onChange={e => handleFileChange('profilePic', e.target.files[0])} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="grid-2" style={{ marginTop: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Update Digital Signature</label>
                <input type="file" accept="image/*" className="form-input" onChange={e => handleFileChange('signature', e.target.files[0])} />
                {settings.signature && (
                  <img src={settings.signature} alt="Signature Preview" style={{ maxHeight: 50, marginTop: 8, borderRadius: 4, background: '#fff', padding: 4, border: '1px solid var(--border)' }} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Update Official Stamp/Seal</label>
                <input type="file" accept="image/*" className="form-input" onChange={e => handleFileChange('seal', e.target.files[0])} />
                {settings.seal && (
                  <img src={settings.seal} alt="Seal Preview" style={{ maxHeight: 50, marginTop: 8, borderRadius: 4, background: '#fff', padding: 4, border: '1px solid var(--border)' }} />
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Save Settings</button>
          </form>
        )}

        {tab === 'feedback' && (
          <div>
            {feedbacks.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">⭐</div><h3>No feedback yet</h3></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {feedbacks.map(f => (
                  <div key={f.id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Stars v={f.rating} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(f.submitted_at).toLocaleDateString()}</span>
                    </div>
                    {f.comment && <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>"{f.comment}"</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {f.video_quality && <span>📹 Video: {f.video_quality}/5</span>}
                      {f.ease_of_use && <span>📱 Ease: {f.ease_of_use}/5</span>}
                      {f.reported_issue && <span style={{ color: 'var(--warning)' }}>⚠️ Issue reported</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'notifications' && (
          <div>
            {notifications.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔔</div><h3>No Notifications</h3></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map(n => (
                  <div key={n.id} className="glass-card" style={{ opacity: n.is_read ? 0.7 : 1, borderLeft: `3px solid ${n.is_read ? 'var(--border)' : 'var(--primary-light)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9rem' }}>{n.message}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {new Date(n.sent_at || n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'support' && (
          <SupportTab />
        )}
      </div>
    </div>
  );
}

function SupportTab() {
  const [form, setForm] = useState({ issueType: 'general', description: '' });
  const [ticketList, setTicketList] = useState([]);

  const statusBadge = { open: 'badge-danger', 'in-progress': 'badge-warning', closed: 'badge-success' };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/doctor/support');
      setTicketList(res.data);
    } catch (err) {
      console.error('[ERROR] fetchTickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctor/support', { issueType: form.issueType, description: form.description });
      toast.success('Support ticket submitted!');
      setForm({ issueType: 'general', description: '' });
      fetchTickets();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
      <div>
        <h3 style={{ marginBottom: 20 }}>Submit Support Ticket</h3>
        <form onSubmit={submit} className="glass-card">
          <div className="form-group">
            <label className="form-label">Issue Type</label>
            <select className="form-input" value={form.issueType} onChange={e => setForm({...form, issueType: e.target.value})}>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="technical">Technical</option>
              <option value="consultation">Consultation</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Submit</button>
        </form>
      </div>
      <div>
        <h3 style={{ marginBottom: 20 }}>My Support Tickets</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ticketList.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No tickets submitted yet</p></div>
          ) : (
            ticketList.map(t => (
              <div key={t.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-info">{t.issue_type}</span>
                  <span className={`badge ${statusBadge[t.status] || 'badge-secondary'}`}>{t.status}</span>
                </div>
                <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>{t.description}</p>
                {t.response && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', color: 'var(--success)' }}>
                    <strong>✉️ Response:</strong> {t.response}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Submitted: {new Date(t.created_at || t.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
