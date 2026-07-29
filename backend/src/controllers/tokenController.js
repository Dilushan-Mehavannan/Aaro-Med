import { createId, readDb, updateDb } from '../services/localDb.js';
import { sendTokenConfirmation } from '../services/emailService.js';

export const bookToken = async (req, res, next) => {
  try {
    const { doctorId, consultationMode, consultationType, reasonForVisit } = req.body;
    const mode = consultationMode || consultationType;

    if (!doctorId || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await readDb();
    const doctor = db.doctors.find((d) => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    if (!doctor.isAvailable) return res.status(400).json({ error: 'Doctor is not available today' });

    const settings = db.doctorSettings[doctorId] || {};
    const dailyLimit = settings.dailyPatientLimit || 20;
    const today = new Date().toISOString().split('T')[0];
    const todayTokens = db.tokens.filter(
      (t) => t.doctorId === doctorId && t.bookingDate?.startsWith(today) && t.status !== 'cancelled'
    );
    if (todayTokens.length >= dailyLimit) {
      return res.status(400).json({ error: 'Doctor has reached daily patient limit' });
    }

    const existingActive = db.tokens.find(
      (t) =>
        t.doctorId === doctorId &&
        t.patientId === req.user.id &&
        t.bookingDate?.startsWith(today) &&
        (t.status === 'pending' || t.status === 'active')
    );
    if (existingActive) {
      return res.status(409).json({ error: 'You already have an active token with this doctor today' });
    }

    const activeForDoctor = db.tokens.filter(
      (t) => t.doctorId === doctorId && (t.status === 'pending' || t.status === 'active') && t.bookingDate?.startsWith(today)
    );
    const tokenNumber = activeForDoctor.length + 1;

    const newToken = {
      id: createId('token'),
      tokenNumber,
      doctorId,
      patientId: req.user.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      status: 'pending',
      consultationMode: mode,
      consultationType: mode,
      bookingDate: new Date().toISOString(),
      consultationTime: null,
      bookingFee: settings.bookingFee ?? doctor.bookingFee,
      consultationFee: settings.consultationFee ?? doctor.consultationFee,
      paymentStatus: 'pending',
      reasonForVisit: reasonForVisit || '',
    };

    await updateDb((current) => ({
      ...current,
      tokens: [...current.tokens, newToken],
    }));

    const patient = db.users.find((u) => u.id === req.user.id);
    if (patient?.email) {
      sendTokenConfirmation({
        to: patient.email,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: doctor.name,
        tokenNumber: newToken.tokenNumber,
        consultationMode: mode,
        bookingDate: newToken.bookingDate,
      }).catch((err) => console.error('Email error:', err));
    }

    res.status(201).json({ message: 'Token booked successfully', token: newToken });
  } catch (error) {
    next(error);
  }
};

export const getMyTokens = async (req, res, next) => {
  try {
    const db = await readDb();
    const tokens = db.tokens
      .filter((token) => token.patientId === req.user.id)
      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const getQueue = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.query.doctorId;
    if (!doctorId) return res.status(400).json({ error: 'Doctor ID required' });

    const db = await readDb();
    const today = new Date().toISOString().split('T')[0];
    const queueTokens = db.tokens
      .filter((t) => t.doctorId === doctorId && t.bookingDate?.startsWith(today))
      .sort((a, b) => a.tokenNumber - b.tokenNumber)
      .map((t) => ({ tokenNumber: t.tokenNumber, status: t.status }));

    const servingToken = queueTokens.find((t) => t.status === 'active' || t.status === 'serving');
    const currentlyServing = servingToken ? servingToken.tokenNumber : 0;
    const pendingCount = queueTokens.filter((t) => t.status === 'pending').length;
    const estimatedWaitTime = pendingCount * 8;

    res.json({ currentlyServing, tokensInQueue: queueTokens, estimatedWaitTime, pendingCount });
  } catch (error) {
    next(error);
  }
};

export const cancelToken = async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    let updatedToken = null;

    await updateDb((current) => {
      const tokens = current.tokens.map((token) => {
        if (token.id !== tokenId || token.patientId !== req.user.id) return token;
        updatedToken = { ...token, status: 'cancelled', updatedAt: new Date().toISOString() };
        return updatedToken;
      });
      return { ...current, tokens };
    });

    if (!updatedToken) return res.status(404).json({ error: 'Token not found' });
    res.json({ message: 'Token cancelled successfully', token: updatedToken });
  } catch (error) {
    next(error);
  }
};

export const advanceQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    let updatedToken = null;
    await updateDb((current) => {
      let tokens = current.tokens;

      tokens = tokens.map((t) => {
        if (t.doctorId === doctorId && (t.status === 'active' || t.status === 'serving')) {
          return { ...t, status: 'completed', updatedAt: new Date().toISOString() };
        }
        return t;
      });

      const nextPending = tokens
        .filter((t) => t.doctorId === doctorId && t.status === 'pending' && t.bookingDate?.startsWith(today))
        .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

      if (nextPending) {
        tokens = tokens.map((t) => {
          if (t.id === nextPending.id) {
            updatedToken = { ...t, status: 'active', updatedAt: new Date().toISOString() };
            return updatedToken;
          }
          return t;
        });
      }

      return { ...current, tokens };
    });

    res.json({
      message: updatedToken ? `Now serving token #${updatedToken.tokenNumber}` : 'Queue is empty',
      nowServing: updatedToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorQueue = async (req, res, next) => {
  try {
    const db = await readDb();
    const today = new Date().toISOString().split('T')[0];
    const doctorId = req.params.doctorId;

    const tokens = db.tokens
      .filter((t) => t.doctorId === doctorId && t.bookingDate?.startsWith(today))
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    const enriched = tokens.map((t) => {
      const patient = db.users.find((u) => u.id === t.patientId);
      return {
        ...t,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        patientEmail: patient?.email || '',
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};
