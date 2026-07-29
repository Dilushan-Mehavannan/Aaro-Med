import { createId, readDb, updateDb } from '../services/localDb.js';

// ── Users ─────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const db = await readDb();
    const users = db.users.map(({ passwordHash, verificationCode, ...safe }) => safe);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    await updateDb((current) => ({
      ...current,
      users: current.users.map((u) =>
        u.id === userId ? { ...u, isActive: !!isActive, updatedAt: new Date().toISOString() } : u
      ),
    }));
    res.json({ message: 'User status updated' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await updateDb((current) => ({
      ...current,
      users: current.users.filter((u) => u.id !== userId),
    }));
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// ── Doctors ───────────────────────────────────────────
export const addDoctor = async (req, res, next) => {
  try {
    const {
      name, specialty, specialization, location, consultationMode,
      bookingFee, consultationFee, bio, email, phone,
    } = req.body;

    if (!name || !specialty) return res.status(400).json({ error: 'name and specialty required' });

    const initials = name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    const doctor = {
      id: createId('doctor'),
      name, specialty,
      specialization: specialization || '',
      location: location || '',
      consultationMode: consultationMode || 'Hybrid',
      bookingFee: Number(bookingFee) || 100,
      consultationFee: Number(consultationFee) || 500,
      avatar: initials,
      rating: 0,
      reviews: 0,
      totalConsultations: 0,
      isAvailable: true,
      bio: bio || '',
      email: email || '',
      phone: phone || '',
      createdAt: new Date().toISOString(),
    };

    await updateDb((current) => ({
      ...current,
      doctors: [...current.doctors, doctor],
    }));

    res.status(201).json({ message: 'Doctor added', doctor });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const updates = req.body;

    await updateDb((current) => ({
      ...current,
      doctors: current.doctors.map((d) =>
        d.id === doctorId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    }));
    res.json({ message: 'Doctor updated' });
  } catch (error) {
    next(error);
  }
};

export const toggleDoctorAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const db = await readDb();
    const doctor = db.doctors.find((d) => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    await updateDb((current) => ({
      ...current,
      doctors: current.doctors.map((d) =>
        d.id === doctorId ? { ...d, isAvailable: !d.isAvailable } : d
      ),
    }));

    res.json({ message: 'Availability toggled', isAvailable: !doctor.isAvailable });
  } catch (error) {
    next(error);
  }
};

// ── Appointments / Tokens ─────────────────────────────
export const getAllTokens = async (req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.tokens);
  } catch (error) {
    next(error);
  }
};

export const updateTokenStatus = async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'active', 'completed', 'cancelled', 'serving'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await updateDb((current) => ({
      ...current,
      tokens: current.tokens.map((t) =>
        t.id === tokenId ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }));
    res.json({ message: 'Token status updated' });
  } catch (error) {
    next(error);
  }
};

// ── System Stats ──────────────────────────────────────
export const getSystemStats = async (req, res, next) => {
  try {
    const db = await readDb();

    const totalPatients = db.users.filter((u) => u.role === 'patient').length;
    const totalDoctors = db.doctors.length;
    const totalTokens = db.tokens.length;
    const completedConsultations = db.tokens.filter((t) => t.status === 'completed').length;
    const totalRevenue = (db.payments || [])
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const openIssues = (db.issueReports || []).filter((r) => r.status === 'open').length;

    res.json({
      totalPatients,
      totalDoctors,
      totalTokens,
      completedConsultations,
      totalRevenue,
      openIssues,
      recentTokens: db.tokens.slice(-10).reverse(),
    });
  } catch (error) {
    next(error);
  }
};

// ── Issue Reports ─────────────────────────────────────
export const getIssueReports = async (req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.issueReports || []);
  } catch (error) {
    next(error);
  }
};

export const resolveIssueReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { resolution } = req.body;

    await updateDb((current) => ({
      ...current,
      issueReports: (current.issueReports || []).map((r) =>
        r.id === reportId
          ? { ...r, status: 'resolved', resolution: resolution || '', resolvedAt: new Date().toISOString() }
          : r
      ),
    }));
    res.json({ message: 'Issue resolved' });
  } catch (error) {
    next(error);
  }
};
