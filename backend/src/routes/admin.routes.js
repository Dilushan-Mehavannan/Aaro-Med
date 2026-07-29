import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { guardAdmin } from '../middlewares/role.middleware.js';
import {
  getUsers, updateUserStatus,
  getPendingDoctors, approveDoctor, rejectDoctor,
  getLogs, getAppointments,
  getAdminNotifications, getAllFeedback,
  getReports, getSupportTickets, updateSupportTicket,
  getPrescriptions, getPayments
} from '../controllers/admin.controller.js';

const router = express.Router();
router.use(verifyToken, guardAdmin);

router.get('/users', getUsers);
router.put('/users/:userId/status', updateUserStatus);
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:doctorId/approve', approveDoctor);
router.put('/doctors/:doctorId/reject', rejectDoctor);
router.get('/logs', getLogs);
router.get('/appointments', getAppointments);
router.get('/notifications', getAdminNotifications);
router.get('/feedback', getAllFeedback);
router.get('/reports', getReports);
router.get('/support-tickets', getSupportTickets);
router.put('/support-tickets/:ticketId', updateSupportTicket);
router.get('/prescriptions', getPrescriptions);
router.get('/payments', getPayments);

export default router;
