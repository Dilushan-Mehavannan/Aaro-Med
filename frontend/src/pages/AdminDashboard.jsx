import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'users', icon: '👥', label: 'User Management' },
  { id: 'doctors', icon: '👨‍⚕️', label: 'Doctor Management' },
  { id: 'appointments', icon: '📅', label: 'Appointments' },
  { id: 'reports', icon: '📊', label: 'Reports' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'feedback', icon: '⭐', label: 'Feedback' },
  { id: 'logs', icon: '🛡️', label: 'System Logs' },
  { id: 'support', icon: '🎫', label: 'Help Desk' },
  { id: 'data', icon: '💾', label: 'Data & Records' },
];

const statusBadge = { open: 'badge-danger', 'in-progress': 'badge-warning', closed: 'badge-success' };

export default function AdminDashboard() {
  const [section, setSection] = useState('reports');
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [logs, setLogs] = useState({ logs: [], total: 0 });
  const [tickets, setTickets] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [ticketResponse, setTicketResponse] = useState({});
  const [dataTab, setDataTab] = useState('prescriptions');
  const [loading, setLoading] = useState(false);

  const load = async (sec) => {
    setLoading(true);
    try {
      switch (sec) {
        case 'users': { const r = await api.get('/admin/users'); setUsers(r.data); break; }
        case 'doctors': {
          const r1 = await api.get('/admin/doctors/pending');
          const r2 = await api.get('/admin/users?role=doctor');
          setPendingDoctors(r1.data);
          setDoctors(r2.data);
          break;
        }
        case 'appointments': { const r = await api.get('/admin/appointments'); setAppointments(r.data); break; }
        case 'reports': { const r = await api.get('/admin/reports'); setReports(r.data); break; }
        case 'notifications': { const r = await api.get('/admin/notifications'); setNotifications(r.data); break; }
        case 'feedback': { const r = await api.get('/admin/feedback'); setFeedbacks(r.data); break; }
        case 'logs': { const r = await api.get('/admin/logs'); setLogs(r.data); break; }
        case 'support': { const r = await api.get('/admin/support-tickets'); setTickets(r.data); break; }
        case 'data': {
          const [p, pay] = await Promise.all([api.get('/admin/prescriptions'), api.get('/admin/payments')]);
          setPrescriptions(p.data); setPayments(pay.data);
          break;
        }
      }
    } catch (err) { toast.error('Failed to load data'); } finally { setLoading(false); }
  };

  const fetchAdminNotifications = async () => {
    try {
      const r = await api.get('/admin/notifications');
      setNotifications(r.data);
    } catch (err) {
      console.error('[ERROR] fetchAdminNotifications:', err);
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  useEffect(() => {
    load(section);
    if (section === 'notifications') {
      // Clear/refresh notifications status
      fetchAdminNotifications();
    }
  }, [section]);

  const handleUserStatus = async (userId, isActive) => {
    try { await api.put(`/admin/users/${userId}/status`, { is_active: isActive }); toast.success('Updated'); load('users'); } catch { toast.error('Failed'); }
  };

  const handleApproveDoctor = async (doctorId) => {
    try { await api.put(`/admin/doctors/${doctorId}/approve`); toast.success('Doctor approved!'); load('doctors'); } catch { toast.error('Failed'); }
  };

  const handleRejectDoctor = async (doctorId) => {
    try { await api.put(`/admin/doctors/${doctorId}/reject`, { reason: rejectReason }); toast.success('Doctor rejected'); setRejectModal(null); setRejectReason(''); load('doctors'); } catch { toast.error('Failed'); }
  };

  const handleTicketUpdate = async (ticketId, status) => {
    try {
      await api.put(`/admin/support-tickets/${ticketId}`, { status, response: ticketResponse[ticketId] || '' });
      toast.success('Ticket updated'); load('support');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page-wrapper">
      <div className="sidebar-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '8px 16px 14px', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
          {SECTIONS.map(s => {
            const isNotifications = s.id === 'notifications';
            const unreadCount = isNotifications ? notifications.filter(n => !n.is_read).length : 0;
            return (
              <button key={s.id} className={`sidebar-item ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="icon">{s.icon}</span> {s.label}
                </span>
                {unreadCount > 0 && (
                  <span style={{ 
                    background: 'var(--danger)', 
                    color: 'white', 
                    borderRadius: '10px', 
                    padding: '2px 8px', 
                    fontSize: '0.65rem', 
                    fontWeight: 800,
                    marginRight: 8
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content */}
        <div className="sidebar-content">
          {loading && <div className="loading-spinner" />}

          {/* Reports */}
          {section === 'reports' && reports && (
            <div>
              <h2 style={{ marginBottom: 24 }}>📊 System Reports</h2>
              <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                  ['Total Consultations', reports.totalConsultations, '📋'],
                  ['Completed', reports.totalCompleted, '✅'],
                  ['Revenue (LKR)', `${parseFloat(reports.totalRevenue || 0).toLocaleString()}`, '💰'],
                  ['Pending', reports.totalPending, '⏳'],
                ].map(([label, value, icon]) => (
                  <div key={label} className="stat-card">
                    <div className="stat-icon">{icon}</div>
                    <div className="stat-value">{value}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>

              {reports.consultationsPerDay?.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 16 }}>Consultations (Last 30 Days)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={reports.consultationsPerDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {reports.avgRatingPerDoctor?.length > 0 && (
                <div className="glass-card">
                  <h4 style={{ marginBottom: 16 }}>Average Rating per Doctor</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={reports.avgRatingPerDoctor}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="doctorName" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                      <Bar dataKey="rating" fill="#f59e0b" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {section === 'users' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>👥 User Management</h2>
              <div style={{ overflowX: 'auto' }} className="glass-card">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td><span className="badge badge-info">{u.role}</span></td>
                        <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleUserStatus(u.id, !u.is_active)}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Doctors */}
          {section === 'doctors' && (
            <div>
              <h2 style={{ marginBottom: 20 }}>👨‍⚕️ Doctor Management</h2>
              <h4 style={{ marginBottom: 12, color: 'var(--warning)' }}>⏳ Pending Approval ({pendingDoctors.length})</h4>
              {pendingDoctors.length === 0 ? <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>No pending applications</p> : (
                <div className="glass-card" style={{ marginBottom: 24, overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Doctor</th><th>Specialization</th><th>Clinic</th><th>Submitted</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingDoctors.map(d => (
                        <tr key={d.id}>
                          <td>{d.user?.name}</td>
                          <td>{d.specialization}</td>
                          <td>{d.clinic_name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-success btn-sm" onClick={() => handleApproveDoctor(d.id)}>✓ Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(d.id)}>✗ Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h4 style={{ marginBottom: 12 }}>All Doctors</h4>
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {doctors.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                        <td><button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleUserStatus(u.id, !u.is_active)}>{u.is_active ? 'Suspend' : 'Restore'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appointments */}
          {section === 'appointments' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>📅 Appointment Management</h2>
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Mode</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    {appointments.map(t => (
                      <tr key={t.id}>
                        <td><strong>#{t.token_number}</strong></td>
                        <td>{t.patientName}</td>
                        <td>{t.doctorName}</td>
                        <td><span className={`badge ${t.consultation_mode === 'online' ? 'badge-info' : 'badge-secondary'}`}>{t.consultation_mode}</span></td>
                        <td><span className={`badge ${t.status === 'completed' ? 'badge-success' : t.status === 'denied' ? 'badge-danger' : 'badge-warning'}`}>{t.status}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(t.booking_time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs */}
          {section === 'logs' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>🛡️ System Logs</h2>
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>User</th><th>Action</th><th>IP Address</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    {logs.logs?.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontSize: '0.85rem' }}>{l.user?.email || 'Anonymous'}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent)' }}>{l.action}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{l.ip_address}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(l.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback */}
          {section === 'feedback' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>⭐ Feedback Overview</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedbacks.map(f => (
                  <div key={f.id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <span style={{ color: 'var(--warning)' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5-f.rating)}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          Dr. {f.doctor?.user?.name} · {f.patient?.user?.name || 'Anonymous'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(f.submitted_at).toLocaleDateString()}</span>
                    </div>
                    {f.comment && <p style={{ fontSize: '0.9rem' }}>"{f.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>🔔 Notification Management</h2>
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>User</th><th>Type</th><th>Message</th><th>Sent</th><th>Read</th></tr></thead>
                  <tbody>
                    {notifications.map(n => (
                      <tr key={n.id}>
                        <td style={{ fontSize: '0.85rem' }}>{n.user?.email}</td>
                        <td><span className="badge badge-info">{n.type}</span></td>
                        <td style={{ fontSize: '0.85rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(n.sent_at).toLocaleString()}</td>
                        <td><span className={`badge ${n.is_read ? 'badge-success' : 'badge-warning'}`}>{n.is_read ? 'Read' : 'Unread'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Support */}
          {section === 'support' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>🎫 Help Desk</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tickets.map(t => (
                  <div key={t.id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <strong>{t.user?.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({t.user?.email})</span>
                        <span className="badge badge-info" style={{ marginLeft: 8 }}>{t.issue_type}</span>
                      </div>
                      <span className={`badge ${statusBadge[t.status]}`}>{t.status}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>{t.description}</p>
                    {t.response && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: '0.85rem', color: 'var(--success)' }}>
                        ✉️ Response: {t.response}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="form-input" value={ticketResponse[t.id] || ''} onChange={e => setTicketResponse({...ticketResponse, [t.id]: e.target.value})} placeholder="Write response..." style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }} />
                      <select className="form-input" style={{ width: 130, fontSize: '0.85rem', padding: '8px 10px' }} defaultValue={t.status} id={`status-${t.id}`}>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => handleTicketUpdate(t.id, document.getElementById(`status-${t.id}`)?.value || t.status)}>Send</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data & Records */}
          {section === 'data' && (
            <div>
              <h2 style={{ marginBottom: 24 }}>💾 Data & Records</h2>
              <div className="tabs" style={{ marginBottom: 20 }}>
                {[['prescriptions','💊 Prescriptions'], ['payments','💳 Payments']].map(([t, lbl]) => (
                  <button key={t} className={`tab-btn ${dataTab === t ? 'active' : ''}`} onClick={() => setDataTab(t)}>{lbl}</button>
                ))}
              </div>
              {dataTab === 'prescriptions' && (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Doctor</th><th>Patient</th><th>Issued</th><th>Locked</th><th>PDF</th></tr></thead>
                    <tbody>
                      {prescriptions.map(p => (
                        <tr key={p.id}>
                          <td>{p.doctorName}</td>
                          <td>{p.patientName}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(p.issued_at).toLocaleDateString()}</td>
                          <td><span className={`badge ${p.is_locked ? 'badge-warning' : 'badge-success'}`}>{p.is_locked ? '🔒 Locked' : '🔓 Unlocked'}</span></td>
                          <td>{p.pdf_url ? <span className="badge badge-success">✓ Generated</span> : <span className="badge badge-secondary">Pending</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {dataTab === 'payments' && (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Patient</th><th>Amount</th><th>Type</th><th>Status</th><th>Paid At</th></tr></thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td>{p.patient?.user?.name}</td>
                          <td style={{ fontWeight: 700 }}>LKR {parseFloat(p.amount).toFixed(2)}</td>
                          <td><span className="badge badge-info">{p.type}</span></td>
                          <td><span className={`badge ${p.status === 'success' ? 'badge-success' : p.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>{p.status}</span></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Reject Doctor Application</h3>
            <div className="form-group">
              <label className="form-label">Reason for Rejection</label>
              <textarea className="form-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleRejectDoctor(rejectModal)}>Reject Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
