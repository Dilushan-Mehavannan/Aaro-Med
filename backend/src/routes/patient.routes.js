import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { guardPatient } from '../middlewares/role.middleware.js';
import {
  getDoctors, getDoctorById, getPsychiatrists,
  createToken, getMyTokens, getQueue,
  getPrescription, downloadPrescription,
  submitFeedback, getNotifications, createSupportTicket,
  getConsultation, getPatientSupportTickets
} from '../controllers/patient.controller.js';

const router = express.Router();

// ✅ Public routes — no auth needed (landing page, doctor search, queue view)
router.get('/doctors', getDoctors);
router.get('/doctors/psychiatrists', getPsychiatrists);
router.get('/doctors/:doctorId', getDoctorById);
router.get('/queue/:doctorId', getQueue);

// 🔒 Protected routes — require patient auth
router.use(verifyToken, guardPatient);
router.post('/tokens', createToken);
router.get('/tokens/my', getMyTokens);
router.get('/consultations/:consultationId', getConsultation);
router.get('/prescriptions/:prescriptionId', getPrescription);
router.get('/prescriptions/:prescriptionId/download', downloadPrescription);
router.post('/feedback', submitFeedback);
router.get('/notifications', getNotifications);
router.post('/support', createSupportTicket);
router.get('/support', getPatientSupportTickets);

export default router;
