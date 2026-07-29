import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, role } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join rooms based on role
      if (role === 'patient' && user?.patient?.id) {
        socket.emit('join:patient', user.patient.id);
      }
      if ((role === 'doctor' || role === 'psychiatrist') && user?.doctor?.id) {
        socket.emit('join:doctor', user.doctor.id);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, role]);

  const joinQueueRoom = (doctorId) => {
    socketRef.current?.emit('join:queue', doctorId);
  };

  const value = React.useMemo(() => ({
    socket: socketRef.current, connected, joinQueueRoom
  }), [connected]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
