import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VideoCallPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [roomUrl, setRoomUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    api.get(`/patient/consultations/${consultationId}`)
      .then(res => {
        if (res.data && res.data.video_room_url) {
          setRoomUrl(res.data.video_room_url);
        } else {
          toast.error('No video room URL found for this consultation.');
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load consultation details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [consultationId]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading video room details...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, background: 'rgba(30,41,59,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: joined ? 'var(--success)' : 'var(--warning)' }}>●</span>
          <span style={{ fontWeight: 700 }}>
            {joined ? 'Video Consultation in Progress' : 'Ready to Join Consultation'}
          </span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => navigate('/dashboard')}>End Call & Exit</button>
      </div>

      {!joined ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 20 }}>
          <div className="glass-card" style={{ maxWidth: 450, width: '100%', textAlign: 'center', padding: 30, background: 'rgba(30,41,59,0.8)' }}>
            <h3 style={{ marginBottom: 12, color: 'var(--primary-light)' }}>📹 Video Consultation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 24 }}>
              Your consultation is ready. Please click the button below to join the call and grant camera and microphone access.
            </p>
            <button
              className="btn btn-success"
              style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700 }}
              onClick={() => setJoined(true)}
              disabled={!roomUrl}
            >
              Join Consultation Call
            </button>
          </div>
        </div>
      ) : (
        <iframe
          src={roomUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="Video Consultation"
        />
      )}
    </div>
  );
}
