import { useState } from 'react';

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' };
const btn = (color = '#0ea5e9') => ({ background: color, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 });

const FAQS = [
  { q: 'How do I book a consultation token?', a: 'Go to the Doctors page, find a doctor, and click "Book Token". You\'ll be assigned a sequential number and receive a confirmation email.' },
  { q: 'What is the difference between booking fee and consultation fee?', a: 'The booking fee is paid when you reserve your token to confirm your slot. The consultation fee is paid after the appointment is completed.' },
  { q: 'Can I cancel my token?', a: 'Yes. Go to your Dashboard > My Tokens and click Cancel on the token you wish to cancel. Cancellations before the appointment may be eligible for a refund.' },
  { q: 'How do I track my queue position?', a: 'Go to the Queue page and select your doctor. The system shows the currently serving token number and how many patients are ahead of you, updating in real time.' },
  { q: 'How do I access my prescription?', a: 'After your consultation is completed, log in and go to Dashboard > My Prescriptions. You can view and download your digital prescription there.' },
  { q: 'Are mental health consultations private?', a: 'Yes. Our psychiatrist module uses an anonymous queue system. Your identity is not disclosed to other patients, and consultations are conducted in a confidential online environment.' },
  { q: 'How does online payment work?', a: 'MediToken integrates with PayHere, a trusted Sri Lankan payment gateway. You can pay by card or other supported methods. All transactions are encrypted and secure.' },
  { q: 'What do I do if the video call drops during an online consultation?', a: 'Refresh the page and rejoin the session. If the problem persists, report it using the Feedback > Report Issue page and our team will assist you.' },
  { q: 'How do I change my profile information?', a: 'Log in and go to Dashboard > My Profile. From there you can update your personal details, contact information, and address.' },
  { q: 'Is my medical data safe?', a: 'Yes. All data is encrypted in transit and at rest. Prescriptions and medical records are only accessible by you and your treating doctor.' },
];

const GUIDES = [
  { title: '📋 How to Book a Token', steps: ['Register or log in to MediToken.', 'Go to Browse Doctors and search for your required specialist.', 'Click Book Token on the doctor\'s card.', 'Select consultation mode (Online / Physical).', 'Confirm your booking — you\'ll receive a confirmation email.'] },
  { title: '💳 How to Make a Payment', steps: ['After booking, go to Dashboard > My Tokens.', 'Click Pay Booking Fee on your active token.', 'You\'ll be redirected to the PayHere secure payment page.', 'Complete payment by card or other method.', 'A receipt will be emailed to you after successful payment.'] },
  { title: '📄 Viewing Your Prescription', steps: ['After your consultation is completed by the doctor, go to Dashboard.', 'Click the Prescriptions tab.', 'Find your prescription and click View.', 'Download as PDF for your records.'] },
  { title: '🧠 Mental Health Consultation', steps: ['Go to Psychiatrists in the menu.', 'Browse available psychiatrists (names only, no personal exposure).', 'Book an anonymous token — your real name is not shown in the queue.', 'Attend via the secure online video link provided.', 'All records are kept strictly confidential.'] },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'var(--card)', border: 'none', padding: '0.9rem 1rem', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
        {q}
        <span style={{ color: '#0ea5e9' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '0.75rem 1rem 1rem', fontSize: '0.875rem', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>{a}</div>}
    </div>
  );
}

export default function HelpDesk() {
  const [tab, setTab] = useState('faq');
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)', padding: '80px 1rem 2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🏥</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>Help & Support</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Find answers, guides, and contact our support team</p>
        </div>

        {/* Emergency Banner */}
        <div style={{ background: '#ef444411', border: '1px solid #ef4444', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div>
            <strong style={{ color: '#ef4444' }}>Medical Emergency?</strong>
            <span style={{ color: 'var(--text)', marginLeft: '0.5rem' }}>Call emergency services immediately: <strong>1990</strong> (Suwaseriya) or <strong>011-2691111</strong></span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[['faq', '❓ FAQs'], ['guides', '📖 Guides'], ['contact', '📞 Contact']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t ? '#0ea5e9' : 'transparent'), color: tab === t ? '#fff' : 'var(--text)', border: tab === t ? 'none' : '1px solid var(--border)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* FAQs */}
        {tab === 'faq' && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search FAQs…"
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card)', color: 'var(--text)', fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }} />
            {filtered.length === 0 ? <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>No FAQs match your search.</p>
              : filtered.map((f, i) => <FAQ key={i} {...f} />)}
          </div>
        )}

        {/* Guides */}
        {tab === 'guides' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {GUIDES.map((g, i) => (
              <div key={i} style={card}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{g.title}</h3>
                <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {g.steps.map((s, j) => <li key={j} style={{ marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--muted)' }}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        {tab === 'contact' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { icon: '📧', title: 'Email Support', detail: 'support@meditoken.lk', sub: 'Response within 24 hours', color: '#0ea5e9' },
              { icon: '📞', title: 'Phone Support', detail: '+94 11 234 5678', sub: 'Mon–Fri, 8am–6pm', color: '#10b981' },
              { icon: '💬', title: 'Live Chat', detail: 'Available in the bottom-right corner', sub: 'Mon–Sat, 9am–5pm', color: '#8b5cf6' },
              { icon: '📍', title: 'Head Office', detail: 'No. 42, Medical Tower, Colombo 03', sub: 'Sri Lanka', color: '#f59e0b' },
            ].map(c => (
              <div key={c.title} style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
                <div style={{ fontSize: '2.5rem', background: c.color + '22', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.title}</div>
                  <div style={{ color: c.color, fontWeight: 600 }}>{c.detail}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{c.sub}</div>
                </div>
              </div>
            ))}

            <div style={card}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Support Categories</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem' }}>
                {[
                  ['🎫', 'Booking Help'], ['💳', 'Payment Support'], ['📋', 'Prescription Help'],
                  ['🎥', 'Technical Issues'], ['🧠', 'Mental Health Line'], ['🔒', 'Privacy & Security'],
                ].map(([icon, label]) => (
                  <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
