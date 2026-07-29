import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { initiatePayment, payhereNotify, getPaymentStatus, demoPaymentSuccess } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/initiate', verifyToken, initiatePayment);
router.post('/notify', payhereNotify); // No JWT - verified by hash
router.post('/demo-success', verifyToken, demoPaymentSuccess); // Demo sandbox approval
router.get('/status/:tokenId/:type', verifyToken, getPaymentStatus);

export default router;
