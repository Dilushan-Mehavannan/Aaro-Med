import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--teal)', marginBottom: '1rem' }}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/home" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--teal)', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 600 }}>
        Go Home
      </Link>
    </div>
  );
}
