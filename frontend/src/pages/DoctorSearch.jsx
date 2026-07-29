import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';
import { useSocket } from '../context/SocketContext';

export default function DoctorSearch() {
  const { socket } = useSocket();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [consultType, setConsultType] = useState('');
  const [specialization, setSpecialization] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (consultType) params.set('consultation_type', consultType);
      if (specialization) params.set('specialization', specialization);
      const res = await api.get(`/patient/doctors?${params}`);
      setDoctors(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDoctors();
    if (socket) {
      socket.on('doctors:updated', fetchDoctors);
      return () => socket.off('doctors:updated');
    }
  }, [consultType, specialization, socket]);

  const handleSearch = (e) => { e.preventDefault(); fetchDoctors(); };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="section-header">
          <h1 className="section-title">Find Doctors</h1>
          <p className="section-subtitle">Search from our network of approved specialists</p>
        </div>

        <form onSubmit={handleSearch} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20, marginBottom: 32 }}>
          <div className="grid-auto" style={{ gap: 12 }}>
            <input className="form-input" placeholder="🔍 Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-input" value={specialization} onChange={e => setSpecialization(e.target.value)}>
              <option value="">All Specializations</option>
              {['General', 'Cardiologist', 'Psychiatrist', 'Dermatologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Ophthalmologist'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select className="form-input" value={consultType} onChange={e => setConsultType(e.target.value)}>
              <option value="">All Types</option>
              <option value="online">Online</option>
              <option value="physical">Physical</option>
              <option value="both">Both</option>
            </select>
            <button type="submit" className="btn btn-primary btn-full">Search</button>
          </div>
        </form>

        {loading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍⚕️</div>
            <h3>No Doctors Found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found</p>
            <div className="grid-auto">
              {doctors.map(d => <DoctorCard key={d.id} doctor={d} activeMode={consultType} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
