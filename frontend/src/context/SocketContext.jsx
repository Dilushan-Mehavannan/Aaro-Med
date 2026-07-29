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

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';
    
    // Serverless backends like Vercel don't support persistent WebSockets/Socket.io
    if (socketUrl.includes('vercel.app')) {
      return;
    }

    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 2,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (role === 'patient' && user?.patient?.id) {
        socket.emit('join:patient', user.patient.id);
      }
      if ((role === 'doctor' || role === 'psychiatrist') && user?.doctor?.id) {
        socket.emit('join:doctor', user.doctor.id);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    return () => { socket?.disconnect(); socketRef.current = null; };
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
