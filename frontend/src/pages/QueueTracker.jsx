import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function QueueTracker() {
  const { doctorId } = useParams();
  const { socket, joinQueueRoom } = useSocket();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callUrl, setCallUrl] = useState(null);

  const fetchQueue = async () => {
    if (!doctorId || doctorId === '[object Object]') {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/patient/queue/${doctorId}`);
      setQueueData(res.data);
    } catch (err) {
      console.error('[ERROR] fetchQueue:', err);
    }
  };

  useEffect(() => {
    fetchQueue().finally(() => setLoading(false));
    joinQueueRoom?.(doctorId);

    if (socket) {
      socket.on('queue:updated', fetchQueue);
      socket.on('call:ready', ({ roomUrl }) => setCallUrl(roomUrl));
      return () => { socket.off('queue:updated'); socket.off('call:ready'); };
    }
  }, [socket, doctorId]);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 600, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 8 }}>Queue Tracker</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Live updates via real-time connection</p>

        {callUrl && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.5)', borderRadius: 16, padding: 24, marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📹</div>
            <h3 style={{ color: 'var(--success)', marginBottom: 8 }}>Your Doctor is Ready!</h3>
            <p style={{ marginBottom: 16 }}>Join your video consultation now</p>
            <a href={callUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-lg">Join Video Call Now</a>
          </div>
        )}

        <div className="glass-card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Now Serving</p>
          <div className="queue-number">{queueData?.current_serving_token ? `#${queueData.current_serving_token}` : '—'}</div>
        </div>

        <div className="grid-3" style={{ marginBottom: 28 }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {queueData?.my_token_number ? `#${queueData.my_token_number}` : '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Your Token</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{queueData?.tokens_ahead ?? 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Ahead of You</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{queueData?.estimated_wait_minutes ?? 0} min</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Est. Wait</div>
          </div>
        </div>

        {queueData?.queue?.length > 0 && (
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 16 }}>Current Queue</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queueData.queue.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600 }}>Token #{t.token_number}</span>
                  <span className={`badge ${t.status === 'serving' ? 'badge-success' : 'badge-primary'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/dashboard" className="btn btn-ghost">← Dashboard</Link>
          <button onClick={fetchQueue} className="btn btn-secondary">🔄 Refresh</button>
        </div>
      </div>
    </div>
  );
}
