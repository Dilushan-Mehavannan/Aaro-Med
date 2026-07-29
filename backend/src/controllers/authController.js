import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      gender,
      address,
    } = req.body;

    const validRoles = ['patient', 'doctor', 'admin'];
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be patient, doctor, or admin' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const alreadyExists = await User.findOne({ email: normalizedEmail });
    if (alreadyExists) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      role,
      phone: phone || '',
      dateOfBirth: dateOfBirth || '',
      gender: gender || '',
      address: address || '',
      emailVerified: true,
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let verifiedUser = null;

    await updateDb((current) => {
      const users = current.users.map((u) => {
        if (u.email.toLowerCase() !== normalizedEmail) {
          return u;
        }
        if (u.verificationCode !== code) {
          return u;
        }
        verifiedUser = {
          ...u,
          emailVerified: true,
        };
        return verifiedUser;
      });

      return {
        ...current,
        users,
      };
    });

    if (!verifiedUser) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({
      message: 'Email verified successfully',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        firstName: verifiedUser.firstName,
        lastName: verifiedUser.lastName,
        role: verifiedUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const db = await readDb();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        emailVerified: !!user.emailVerified,
      },
      profile: {
        medicalHistory: 'No significant medical history provided yet',
        allergies: [],
        currentMedications: [],
        emergencyContact: null,
        insuranceProvider: '',
        insurancePolicyNumber: '',
      },
    });
  } catch (error) {
    next(error);
  }
};
