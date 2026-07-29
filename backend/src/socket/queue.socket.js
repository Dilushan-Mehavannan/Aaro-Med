import { Server } from 'socket.io';

import Doctor from '../models/Doctor.js';

const doctorSockets = new Map(); // doctorId -> Set of socketIds
const socketDoctorMap = new Map(); // socketId -> doctorId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*', credentials: true }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on('join:patient', (patientId) => {
      socket.join(`patient_${patientId}`);
      console.log(`[SOCKET] Patient ${patientId} joined room`);
    });

    socket.on('join:doctor', async (doctorId) => {
      if (!doctorId) return;
      socket.join(`doctor_${doctorId}_queue`);
      
      socketDoctorMap.set(socket.id, doctorId);
      if (!doctorSockets.has(doctorId)) doctorSockets.set(doctorId, new Set());
      doctorSockets.get(doctorId).add(socket.id);

      try {
        await Doctor.findByIdAndUpdate(doctorId, { is_online: true });
        io.emit('doctors:updated');
        console.log(`[SOCKET] Doctor ${doctorId} marked ONLINE`);
      } catch (err) {
        console.error('[SOCKET] Error setting doctor online:', err);
      }
    });

    socket.on('join:queue', (doctorId) => {
      socket.join(`doctor_${doctorId}_queue`);
    });

    socket.on('disconnect', async () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      const doctorId = socketDoctorMap.get(socket.id);
      if (doctorId) {
        socketDoctorMap.delete(socket.id);
        const sockets = doctorSockets.get(doctorId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            doctorSockets.delete(doctorId);
            try {
              await Doctor.findByIdAndUpdate(doctorId, { is_online: false });
              io.emit('doctors:updated');
              console.log(`[SOCKET] Doctor ${doctorId} marked OFFLINE`);
            } catch (err) {
              console.error('[SOCKET] Error setting doctor offline:', err);
            }
          }
        }
      }
    });
  });

  return io;
};

export const getIO = () => io;

export const emitQueueUpdated = (doctorId, queueData) => {
  if (io) io.to(`doctor_${doctorId}_queue`).emit('queue:updated', queueData);
};

export const emitTokenAccepted = (patientId, data) => {
  if (io) io.to(`patient_${patientId}`).emit('token:accepted', data);
};

export const emitTokenDenied = (patientId, data) => {
  if (io) io.to(`patient_${patientId}`).emit('token:denied', data);
};

export const emitCallReady = (patientId, roomUrl) => {
  if (io) io.to(`patient_${patientId}`).emit('call:ready', { roomUrl });
};

export const emitPrescriptionUnlocked = (patientId, prescriptionId) => {
  if (io) io.to(`patient_${patientId}`).emit('prescription:unlocked', { prescriptionId });
};
