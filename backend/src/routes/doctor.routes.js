import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { guardDoctor } from '../middlewares/role.middleware.js';
import {
  registerDoctor, getDoctorDashboard, updateDoctorSettings,
  acceptToken, denyToken, nextToken,
  startConsultation, endConsultation, issuePrescription,
  getDoctorFeedback, doctorCreateSupportTicket, getDoctorSupportTickets, getDoctorNotifications
} from '../controllers/doctor.controller.js';

const router = express.Router();

// Registration doesn't need guardDoctor (user may not have doctor role yet)
router.post('/register', verifyToken, registerDoctor);

// All other routes require doctor role
router.use(verifyToken, guardDoctor);
router.get('/dashboard', getDoctorDashboard);
router.put('/settings', updateDoctorSettings);
router.put('/tokens/:tokenId/accept', acceptToken);
router.put('/tokens/:tokenId/deny', denyToken);
router.put('/tokens/:tokenId/next', nextToken);
router.post('/consultation/start', startConsultation);
router.post('/consultation/end', endConsultation);
router.post('/prescriptions', issuePrescription);
router.get('/feedback', getDoctorFeedback);
router.post('/support', doctorCreateSupportTicket);
router.get('/support', getDoctorSupportTickets);
router.get('/notifications', getDoctorNotifications);

export default router;
