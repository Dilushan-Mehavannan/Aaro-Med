import { Link } from 'react-router-dom';

export default function Home() {
  const features = [
    {
      icon: '🎫',
      title: 'Sequential Token Booking',
      description: 'Reserve your slot online. Tokens are issued first-come first-served—no rigid appointment slots.',
    },
    {
      icon: '🩺',
      title: 'Doctor-Controlled Settings',
      description: 'Doctors define consultation mode, daily limits, fees, and availability—full control in their hands.',
    },
    {
      icon: '🧠',
      title: 'Private Mental Health Access',
      description: 'Dedicated psychiatrist module with minimal identity exposure for stigma-free care.',
    },
    {
      icon: '📋',
      title: 'Digital Prescriptions',
      description: 'Digitally sealed prescriptions uploaded by doctors, locked until payment.',
    },
    {
      icon: '📧',
      title: 'Gmail Notifications',
      description: 'Automatic email alerts for tokens, reminders, and prescription availability.',
    },
    {
      icon: '💳',
      title: 'PayHere Payments',
      description: 'Secure payments via PayHere gateway with transparent pricing.',
    },
  ];

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={heroStyle}>
        <div style={heroTextStyle}>
          <span style={tagStyle}>Smart Healthcare · Batticaloa</span>
          <h1 style={h1Style}>
            Consult Smarter,<br />
            Wait <em style={{ fontStyle: 'italic', color: 'var(--teal)' }}>Less.</em>
          </h1>
          <p style={pStyle}>
            A hybrid token & consultation system where doctors control the flow—book your slot online, arrive relaxed, and access secure digital prescriptions after care.
          </p>
          <div style={heroActionsStyle}>
            <Link to="/doctors" style={btnPrimaryStyle}>
              Find a Doctor
            </Link>
            <Link to="/psychiatrists" style={btnPsychStyle}>
              🧠 Mental Health
            </Link>
          </div>
        </div>

        <div style={heroVisualStyle}>
          <div style={tokenDisplayStyle}>
            <div style={tokenLabelStyle}>
              <span style={statusDotStyle}></span>Now Serving
            </div>
            <div style={tokenNumberStyle}>042</div>
            <div style={tokenLabelStyle}>Dr. Priya Krishnan · General Medicine</div>
          </div>
          <div style={liveQueueStyle}>
            <div style={queueItemStyle}>
              <div style={valStyle}>8</div>
              <div style={lblStyle}>Waiting</div>
            </div>
            <div style={queueItemStyle}>
              <div style={valStyle}>15m</div>
              <div style={lblStyle}>Avg. wait</div>
            </div>
            <div style={queueItemStyle}>
              <div style={valStyle}>3</div>
              <div style={lblStyle}>Doctors online</div>
            </div>
            <div style={queueItemStyle}>
              <div style={valStyle}>✓</div>
              <div style={lblStyle}>Payments secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={containerStyle}>
        <div style={sectionHeaderStyle}>
          <span style={tagStyle}>Core Features</span>
          <h2 style={h2Style}>Everything in one platform</h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '560px', margin: '0 auto' }}>
            Designed around how real clinics operate—not how apps wish they did.
          </p>
        </div>

        <div style={cardsGridStyle}>
          {features.map((feature, idx) => (
            <div key={idx} style={cardStyle}>
              <div style={cardIconStyle}>{feature.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.87rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const heroStyle = {
  minHeight: 'calc(100vh - 64px)',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  alignItems: 'center',
  gap: '3rem',
  padding: '4rem 2rem 2rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

const heroTextStyle = {
  animation: 'fadeIn 0.4s ease both',
};

const h1Style = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
  lineHeight: 1.15,
  color: 'var(--ink)',
  marginBottom: '1.2rem',
};

const h2Style = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
  marginBottom: '0.6rem',
};

const pStyle = {
  fontSize: '1.05rem',
  color: 'var(--muted)',
  lineHeight: 1.7,
  maxWidth: '440px',
  marginBottom: '2rem',
};

const tagStyle = {
  display: 'inline-block',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '0.25rem 0.65rem',
  borderRadius: '100px',
  background: 'var(--mint)',
  color: 'var(--teal-dk)',
  marginBottom: '0.8rem',
};

const heroActionsStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
};

const btnPrimaryStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.8rem',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: 600,
  background: 'var(--teal)',
  color: '#fff',
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.22s',
};

const btnPsychStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.8rem',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: 600,
  background: 'var(--psych)',
  color: '#fff',
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.22s',
};

const heroVisualStyle = {
  position: 'relative',
  background: 'linear-gradient(135deg,var(--teal-dk) 0%,var(--teal) 60%,var(--teal-lt) 100%)',
  borderRadius: 'var(--r-lg)',
  padding: '2.5rem',
  color: '#fff',
  boxShadow: 'var(--shadow-lg)',
  overflow: 'hidden',
  animation: 'fadeIn 0.4s ease both',
};

const tokenDisplayStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  textAlign: 'center',
  marginBottom: '1.5rem',
};

const tokenNumberStyle = {
  fontSize: '5rem',
  fontWeight: 500,
  lineHeight: 1,
  background: 'linear-gradient(180deg,#fff 0%,rgba(255,255,255,.6) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const tokenLabelStyle = {
  fontSize: '0.75rem',
  opacity: 0.7,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const liveQueueStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginTop: '1rem',
};

const queueItemStyle = {
  background: 'rgba(255,255,255,.12)',
  borderRadius: '10px',
  padding: '0.8rem',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,.18)',
};

const valStyle = {
  fontSize: '1.5rem',
  fontWeight: 600,
  fontFamily: "'JetBrains Mono', monospace",
};

const lblStyle = {
  fontSize: '0.7rem',
  opacity: 0.7,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const statusDotStyle = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'var(--gold-lt)',
  marginRight: '0.4rem',
  animation: 'pulse 1.5s infinite',
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem 1.5rem',
};

const sectionHeaderStyle = {
  textAlign: 'center',
  marginBottom: '2.5rem',
};

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.25rem',
};

const cardStyle = {
  background: 'var(--white)',
  borderRadius: 'var(--r)',
  padding: '1.5rem',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all 0.25s',
  cursor: 'pointer',
};

const cardIconStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  display: 'grid',
  placeItems: 'center',
  fontSize: '1.3rem',
  marginBottom: '1rem',
  background: 'var(--mint)',
  color: 'var(--teal-dk)',
};
