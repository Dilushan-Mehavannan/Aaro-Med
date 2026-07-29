import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function VideoConsultation() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [networkQuality, setNetworkQuality] = useState('excellent');
  
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('/api/doctors/');
        setDoctors(response.data);
        
        // If doctorId is in URL, auto-select that doctor
        if (doctorId) {
          const doctor = response.data.find(d => d.id === doctorId);
          if (doctor) {
            setSelectedDoctor(doctor);
            setMessages([
              {
                id: 1,
                from: 'doctor',
                text: `${doctor.name} is ready for consultation`,
                time: new Date().toLocaleTimeString(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [doctorId]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        setCameraPermission('pending');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraPermission('granted');
      } catch (error) {
        setCameraError(error.message || 'Failed to access camera. Please check permissions.');
        setCameraPermission('denied');
      }
    };

    initCamera();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStreamRef.current && isVideoOff) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    } else if (localStreamRef.current && !isVideoOff) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }, [isVideoOff]);

  useEffect(() => {
    if (localStreamRef.current && isMuted) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    } else if (localStreamRef.current && !isMuted) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    let timer = null;
    if (isConnected) {
      timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  const duration = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [seconds]);

  const startCall = () => {
    setIsConnected(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: 'doctor',
        text: `${selectedDoctor?.name || 'Doctor'} is ready for consultation. Please describe your symptoms.`,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const endCall = () => {
    setIsConnected(false);
    setSeconds(0);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: 'doctor',
        text: 'Call ended. Thank you for the consultation.',
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setMessages([
      {
        id: 1,
        from: 'doctor',
        text: `${doctor.name} is ready for consultation`,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const deselectDoctor = () => {
    setSelectedDoctor(null);
    setIsConnected(false);
    setSeconds(0);
    setMessages([]);
    setDraft('');
    navigate('/doctors');
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    const now = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { id: Date.now(), from: 'you', text, time: now }]);
    setDraft('');
  };

  const onDraftKey = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // Doctor Selection Screen
  if (!selectedDoctor) {
    return (
      <div style={pageStyle}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={titleStyle}>Select a Doctor</h1>
          <p style={subtitleStyle}>Choose a healthcare professional for your video consultation</p>
        </div>

        {loadingDoctors ? (
          <div style={loaderContainerStyle}>
            <div style={spinnerStyle} />
            <div>Loading doctors...</div>
          </div>
        ) : doctors.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '2rem' }}>👨‍⚕️</div>
            <div style={{ marginTop: '0.8rem' }}>No doctors available</div>
          </div>
        ) : (
          <div style={doctorGridStyle}>
            {doctors.map((doctor) => (
              <div key={doctor.id} style={doctorCardStyle}>
                <div style={doctorAvatarContainerStyle}>
                  <div style={doctorAvatarLargeStyle}>{doctor.avatar || doctor.name.charAt(0)}</div>
                </div>
                <div style={doctorInfoStyle}>
                  <div style={doctorNameStyle}>{doctor.name}</div>
                  <div style={doctorSpecialtyStyle}>{doctor.specialty}</div>
                  {doctor.location && <div style={doctorLocationStyle}>📍 {doctor.location}</div>}
                  {doctor.rating && <div style={doctorRatingStyle}>
                    ⭐ {doctor.rating.toFixed(1)} ({doctor.reviews || 0} reviews)
                  </div>}
                  <div style={doctorFeeStyle}>
                    💰 LKR {doctor.consultationFee || doctor.bookingFee || 0}
                  </div>
                </div>
                <button
                  style={selectButtonStyle}
                  onClick={() => selectDoctor(doctor)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Video Consultation Screen
  return (
    <div style={pageStyle}>
      <div style={headerContainerStyle}>
        <div style={headerLeftStyle}>
          <h1 style={titleStyle}>Video Consultation</h1>
          <p style={subtitleStyle}>
            {selectedDoctor.name} • {selectedDoctor.specialty} • {selectedDoctor.location}
          </p>
        </div>
        <div style={statusIndicatorStyle}>
          <button style={backButtonStyle} onClick={deselectDoctor}>
            ← Back
          </button>
          <div style={qualityBadgeStyle(networkQuality)}>
            ●{' '}
            {networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}
          </div>
          <div style={timerStyle}>{duration}</div>
        </div>
      </div>

      {cameraPermission === 'denied' && (
        <div style={errorBannerStyle}>
          <span>⚠️ Camera permission denied.</span>
          <span style={{ fontSize: '0.85rem' }}>
            Please enable camera access in your browser settings to proceed.
          </span>
        </div>
      )}

      <div className="tele-grid" style={gridStyle}>
        <section style={videoPanelStyle}>
          <div style={videoContainerStyle}>
            {cameraPermission === 'granted' ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  style={videoElementStyle}
                />
                <div
                  style={{
                    ...remoteVideoPlaceholderStyle,
                    display: isConnected ? 'grid' : 'none',
                  }}
                >
                  <div style={doctorPlaceholderStyle}>
                    {selectedDoctor.name
                      .split(' ')
                      .map((n) => n.charAt(0))
                      .join('')}
                  </div>
                </div>
              </>
            ) : (
              <div style={cameraPermissionPromptStyle}>
                <div style={{ fontSize: '2rem' }}>📷</div>
                <div style={{ marginTop: '0.8rem', fontWeight: 600 }}>Camera Access Required</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                  Allow browser access to your camera
                </div>
              </div>
            )}
          </div>

          <div style={controlBarStyle}>
            <button
              style={controlButtonStyle(isMuted)}
              onClick={() => setIsMuted((v) => !v)}
              disabled={cameraPermission !== 'granted'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button
              style={controlButtonStyle(isVideoOff)}
              onClick={() => setIsVideoOff((v) => !v)}
              disabled={cameraPermission !== 'granted'}
            >
              {isVideoOff ? '📹' : '🎥'}
            </button>
            <button
              style={recordButtonStyle}
              disabled={!isConnected || cameraPermission !== 'granted'}
            >
              ⏺️ Record
            </button>
            {!isConnected ? (
              <button
                style={acceptCallButtonStyle}
                onClick={startCall}
                disabled={cameraPermission !== 'granted'}
              >
                Accept Call
              </button>
            ) : (
              <button style={endCallButtonStyle} onClick={endCall}>
                End Call
              </button>
            )}
          </div>
        </section>

        <section style={chatPanelStyle}>
          <div style={chatTitleStyle}>
            <strong>Consultation Notes</strong>
            <span style={callStatusStyle}>{isConnected ? '●' : '○'} {isConnected ? 'Active' : 'Inactive'}</span>
          </div>

          <div style={chatMessagesStyle}>
            {messages.map((message) => (
              <div key={message.id} style={messageWrapStyle(message.from === 'you')}>
                <div style={messageBubbleStyle(message.from === 'you')}>
                  <div>{message.text}</div>
                  <div style={messageTimeStyle}>{message.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={messageComposerStyle}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onDraftKey}
              placeholder="Type message..."
              style={messageInputStyle}
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              style={messageSendButtonStyle}
              disabled={!isConnected || !draft.trim()}
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const loaderContainerStyle = {
  display: 'grid',
  placeItems: 'center',
  gap: '1rem',
  minHeight: '400px',
  color: 'var(--muted)',
  fontSize: '1.1rem',
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '3px solid var(--border)',
  borderTop: '3px solid var(--teal)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const emptyStateStyle = {
  display: 'grid',
  placeItems: 'center',
  gap: '1rem',
  minHeight: '300px',
  color: 'var(--muted)',
  fontSize: '1.1rem',
};

const doctorGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
};

const doctorCardStyle = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'all 0.2s',
  cursor: 'pointer',
  hover: {
    boxShadow: 'var(--shadow-lg)',
    transform: 'translateY(-2px)',
  },
};

const doctorAvatarContainerStyle = {
  marginBottom: '1rem',
};

const doctorAvatarLargeStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--teal)',
  color: 'white',
  fontWeight: 700,
  fontSize: '1.8rem',
};

const doctorInfoStyle = {
  marginBottom: '1rem',
  width: '100%',
  textAlign: 'center',
};

const doctorNameStyle = {
  fontWeight: 700,
  fontSize: '1.1rem',
  color: 'var(--ink)',
  marginBottom: '0.3rem',
};

const doctorSpecialtyStyle = {
  fontSize: '0.9rem',
  color: 'var(--teal)',
  fontWeight: 600,
  marginBottom: '0.5rem',
};

const doctorLocationStyle = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginBottom: '0.4rem',
};

const doctorRatingStyle = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginBottom: '0.3rem',
};

const doctorFeeStyle = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--ink)',
  marginBottom: '1rem',
};

const selectButtonStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'var(--teal)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const backButtonStyle = {
  padding: '0.5rem 1rem',
  background: 'white',
  color: 'var(--ink)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const pageStyle = {
  paddingTop: '88px',
  minHeight: '100vh',
  maxWidth: '1220px',
  margin: '0 auto',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  paddingBottom: '1.5rem',
  background: 'linear-gradient(135deg, #fafaf7 0%, #f5fffe 100%)',
};

const headerContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--border)',
};

const headerLeftStyle = {
  flex: 1,
};

const titleStyle = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: '1.8rem',
  color: 'var(--ink)',
  marginBottom: '0.2rem',
};

const subtitleStyle = {
  color: 'var(--muted)',
  fontSize: '0.9rem',
};

const statusIndicatorStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
};

const qualityBadgeStyle = (quality) => ({
  padding: '0.4rem 0.8rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  background:
    quality === 'excellent'
      ? '#d4f3e8'
      : quality === 'good'
        ? '#fef3cd'
        : '#f8d7da',
  color:
    quality === 'excellent'
      ? 'var(--success)'
      : quality === 'good'
        ? '#856404'
        : '#721c24',
});

const timerStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--teal)',
};

const errorBannerStyle = {
  background: '#ffe7e7',
  border: '1px solid #f5c6cb',
  color: '#721c24',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  marginBottom: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr',
  gap: '1.2rem',
};

const videoPanelStyle = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  boxShadow: 'var(--shadow-md)',
  overflow: 'hidden',
};

const videoContainerStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#0a2f3a',
  overflow: 'hidden',
};

const videoElementStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transform: 'scaleX(-1)',
};

const remoteVideoPlaceholderStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(135deg, #0B8B8B 0%, #12BFBF 100%)',
  display: 'grid',
  placeItems: 'center',
};

const doctorPlaceholderStyle = {
  width: '140px',
  height: '140px',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(255,255,255,0.15)',
  color: 'white',
  fontWeight: 700,
  fontSize: '2rem',
  border: '2px solid rgba(255,255,255,0.25)',
};

const cameraPermissionPromptStyle = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  color: 'var(--muted)',
};

const controlBarStyle = {
  display: 'flex',
  gap: '0.8rem',
  padding: '1rem',
  background: '#f9f9f7',
  borderTop: '1px solid var(--border)',
};

const controlButtonStyle = (active) => ({
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: `2px solid ${active ? 'var(--danger)' : 'var(--border)'}`,
  background: active ? '#ffe7e7' : 'white',
  cursor: 'pointer',
  fontSize: '1.2rem',
  display: 'grid',
  placeItems: 'center',
  transition: 'all 0.2s',
});

const recordButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '2px solid var(--danger)',
  background: '#ffe7e7',
  cursor: 'pointer',
  fontSize: '1rem',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 600,
};

const acceptCallButtonStyle = {
  marginLeft: 'auto',
  padding: '0.5rem 1.2rem',
  background: 'var(--success)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const endCallButtonStyle = {
  marginLeft: 'auto',
  padding: '0.5rem 1.2rem',
  background: 'var(--danger)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const chatPanelStyle = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const chatTitleStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem',
  borderBottom: '1px solid var(--border)',
  fontWeight: 600,
};

const callStatusStyle = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginLeft: '0.5rem',
};

const chatMessagesStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '0.8rem',
  background: 'var(--cream)',
};

const messageWrapStyle = (mine) => ({
  display: 'flex',
  justifyContent: mine ? 'flex-end' : 'flex-start',
  marginBottom: '0.6rem',
});

const messageBubbleStyle = (mine) => ({
  maxWidth: '85%',
  padding: '0.6rem 0.9rem',
  borderRadius: '10px',
  background: mine ? 'var(--teal)' : 'white',
  color: mine ? 'white' : 'var(--ink)',
  border: mine ? 'none' : '1px solid var(--border)',
  wordWrap: 'break-word',
});

const messageTimeStyle = {
  marginTop: '0.3rem',
  fontSize: '0.7rem',
  opacity: 0.6,
};

const messageComposerStyle = {
  display: 'flex',
  gap: '0.6rem',
  padding: '0.8rem',
  borderTop: '1px solid var(--border)',
  background: '#f9f9f7',
};

const messageInputStyle = {
  flex: 1,
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.6rem 0.8rem',
  fontSize: '0.9rem',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

const messageSendButtonStyle = {
  padding: '0.6rem 1rem',
  background: 'var(--teal)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};
