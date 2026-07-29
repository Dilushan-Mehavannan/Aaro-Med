import { useToastStore } from '../store/index.js';

export default function Toast() {
  const { toasts } = useToastStore();

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <div key={toast.id} style={getToastStyle(toast.type)}>
          <span style={{ fontSize: '1.1rem', marginRight: '0.6rem' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

const containerStyle = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const getToastStyle = (type) => ({
  background: type === 'error' ? 'var(--danger)' : 'var(--ink)',
  color: '#fff',
  padding: '0.8rem 1.2rem',
  borderRadius: '12px',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 8px 32px rgba(0,0,0,.3)',
  maxWidth: '320px',
  animation: 'slideUp 0.35s cubic-bezier(.34,1.56,.64,1)',
});
