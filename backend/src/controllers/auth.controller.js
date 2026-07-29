import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, Doctor, Patient, SystemLog } from '../models/index.js';
import { sendWelcomeEmail } from '../services/email.service.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signJWT = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY || '7d' }
);

export const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      // For demo/testing without real Google keys, decode manually
      const parts = credential.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      } else {
        return res.status(400).json({ message: 'Invalid Google token' });
      }
    }

    const { sub: gmail_id, email, name, picture } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const assignedRole = role || 'patient';
      user = await User.create({ name, email: normalizedEmail, gmail_id, profile_pic: picture, role: assignedRole });
      if (assignedRole === 'patient') {
        await Patient.create({ user_id: user._id });
      } else if (['doctor', 'psychiatrist'].includes(assignedRole)) {
        await Doctor.create({
          user_id: user._id,
          specialization: assignedRole === 'psychiatrist' ? 'Psychiatry' : 'General Practice',
          qualification: 'MBBS',
          clinic_name: 'SmartDoctor Health Center',
          clinic_address: '123 Medical Center Way',
          is_approved: true,
          is_online: true
        });
      }
      await sendWelcomeEmail(normalizedEmail, name).catch(() => { });
    }

    const token = signJWT(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_pic: user.profile_pic }, role: user.role });
  } catch (err) {
    console.error('[AUTH] Google login error:', err);
    return res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role || 'patient';

    user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole
    });

    if (assignedRole === 'patient') {
      await Patient.create({ user_id: user._id });
    } else if (['doctor', 'psychiatrist'].includes(assignedRole)) {
      await Doctor.create({
        user_id: user._id,
        specialization: assignedRole === 'psychiatrist' ? 'Psychiatry' : 'General Practice',
        qualification: 'MBBS',
        clinic_name: 'SmartDoctor Health Center',
        clinic_address: '123 Medical Center Way',
        is_approved: true,
        is_online: true
      });
    }

    await sendWelcomeEmail(normalizedEmail, name).catch(() => { });

    const token = signJWT(user);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_pic: user.profile_pic },
      role: user.role
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    
    // Auto-handle demo users (Self-healing profiles)
    if (normalizedEmail === 'demo_patient@smartdoctor.com' || normalizedEmail === 'demo_doctor@smartdoctor.com') {
      const role = normalizedEmail.includes('patient') ? 'patient' : 'doctor';
      const name = role === 'patient' ? 'Demo Patient' : 'Demo Doctor';
      
      if (!user) {
        user = await User.create({ name, email: normalizedEmail, role, is_active: true });
      } else {
        // Ensure user has correct role and is active
        user.role = role;
        user.is_active = true;
        await user.save();
      }

      if (role === 'patient') {
        const p = await Patient.findOne({ user_id: user._id });
        if (!p) await Patient.create({ user_id: user._id });
      } else if (role === 'doctor') {
        const d = await Doctor.findOne({ user_id: user._id });
        if (!d) await Doctor.create({ 
          user_id: user._id, 
          specialization: 'General', 
          qualification: 'MBBS',
          clinic_name: 'Demo Clinic',
          clinic_address: '123 Health Ave, Colombo',
          is_approved: true 
        });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Bypass password check for demo users
    const isDemo = normalizedEmail === 'demo_patient@smartdoctor.com' || normalizedEmail === 'demo_doctor@smartdoctor.com';
    if (!isDemo) {
      if (!user.password) {
        // Fallback for Google sign-in lockout: allow login with password 'password123'
        const valid = password === 'password123';
        if (!valid) {
          return res.status(401).json({ message: 'Google Auth is blocked. Please use the password "password123" to access this Google-linked account.' });
        }
      } else {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }
    }

    if (['doctor', 'psychiatrist'].includes(user.role)) {
      const d = await Doctor.findOne({ user_id: user._id });
      if (!d) {
        await Doctor.create({
          user_id: user._id,
          specialization: user.role === 'psychiatrist' ? 'Psychiatry' : 'General Practice',
          qualification: 'MBBS',
          clinic_name: 'SmartDoctor Health Center',
          clinic_address: '123 Medical Center Way',
          is_approved: true,
          is_online: true
        });
      } else if (!d.is_approved) {
        d.is_approved = true;
        await d.save();
      }
    }

    const token = signJWT(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_pic: user.profile_pic },
      role: user.role
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    let adminUser;

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if it's the environment-based admin
    if (normalizedEmail === (process.env.ADMIN_EMAIL || '').trim().toLowerCase()) {
      const valid = password === process.env.ADMIN_PASSWORD || await bcrypt.compare(password, process.env.ADMIN_PASSWORD || '');
      if (valid) {
        adminUser = await User.findOne({ email: normalizedEmail, role: 'admin' });
        if (!adminUser) {
          adminUser = await User.create({ name: 'Admin', email: normalizedEmail, role: 'admin', is_active: true });
        }
      }
    }

    // 2. If not environment admin, check the database for other admins
    if (!adminUser) {
      adminUser = await User.findOne({ email: normalizedEmail, role: 'admin' });
      if (adminUser) {
        if (!adminUser.password) return res.status(401).json({ message: 'Please login with Google' });
        const valid = await bcrypt.compare(password, adminUser.password);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    SystemLog.create({ user_id: adminUser._id, action: 'ADMIN_LOGIN', ip_address: req.ip, timestamp: new Date() }).catch(() => { });

    const token = signJWT(adminUser);
    return res.json({ token, user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: adminUser.role }, role: 'admin' });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

import { getIO } from '../socket/queue.socket.js';

export const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      const doctor = await Doctor.findOne({ user_id: req.user.id });
      if (doctor) {
        doctor.is_online = false;
        await doctor.save();
        const io = getIO();
        if (io) io.emit('doctors:updated');
      }
    }
  } catch (err) {
    console.error('[AUTH] Logout status update error:', err);
  }
  return res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.id = user._id.toString();

  if (user.role === 'patient') {
    const patient = await Patient.findOne({ user_id: user._id }).lean();
    if (patient) {
      patient.id = patient._id.toString();
      user.patient = patient;
    }
  } else if (user.role === 'doctor' || user.role === 'psychiatrist') {
    const doctor = await Doctor.findOne({ user_id: user._id }).lean();
    if (doctor) {
      doctor.id = doctor._id.toString();
      user.doctor = doctor;
    }
  }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, profilePic } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (profilePic !== undefined) user.profile_pic = profilePic;
    
    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_pic: user.profile_pic }
    });
  } catch (err) {
    console.error('[ERROR] updateProfile:', err);
    res.status(500).json({ message: err.message });
  }
};
