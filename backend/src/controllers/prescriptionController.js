import { createId, readDb, updateDb } from '../services/localDb.js';

export const createPrescription = async (req, res, next) => {
  try {
    const { tokenId, diagnosis, medications, notes, followUpDays } = req.body;

    if (!tokenId || !diagnosis || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await readDb();
    const token = db.tokens.find((t) => t.id === tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const prescription = {
      id: createId('prescription'),
      tokenId,
      patientId: token.patientId,
      doctorId: req.user.id,
      doctorName: token.doctorName,
      sealName: token.doctorName,
      diagnosis,
      medications,
      notes: notes || '',
      followUpDays: followUpDays || 0,
      isLocked: false,
      unlockStatus: 'completed',
      createdAt: new Date().toISOString(),
    };

    await updateDb((current) => ({
      ...current,
      prescriptions: [...current.prescriptions, prescription],
      tokens: current.tokens.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              status: 'completed',
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const db = await readDb();
    const prescriptions = db.prescriptions.filter((p) => {
      if (req.user.role === 'doctor') {
        return p.doctorId === req.user.id;
      }
      return p.patientId === req.user.id;
    });
    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const db = await readDb();
    const prescription = db.prescriptions.find((p) => p.id === prescriptionId);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const hasAccess =
      req.user.role === 'doctor'
        ? prescription.doctorId === req.user.id
        : prescription.patientId === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(prescription);
  } catch (error) {
    next(error);
  }
};

export const unlockPrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;

    let updatedPrescription = null;
    await updateDb((current) => {
      const prescriptions = current.prescriptions.map((prescription) => {
        if (prescription.id !== prescriptionId) {
          return prescription;
        }
        updatedPrescription = {
          ...prescription,
          isLocked: false,
          unlockStatus: 'completed',
          updatedAt: new Date().toISOString(),
        };
        return updatedPrescription;
      });

      return {
        ...current,
        prescriptions,
      };
    });

    if (!updatedPrescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({
      message: 'Prescription unlocked',
      prescription: updatedPrescription,
    });
  } catch (error) {
    next(error);
  }
};
