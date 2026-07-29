import express from 'express';
import { googleLogin, adminLogin, logout, getMe, register, login, updateProfile } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/admin/login', adminLogin);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

export default router;
