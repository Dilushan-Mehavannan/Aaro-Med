import { readDb, updateDb } from '../services/localDb.js';

export const getAllDoctors = async (req, res, next) => {
  try {
    const { specialty, mode, search } = req.query;

    const db = await readDb();

    const waitingMap = db.tokens.reduce((acc, token) => {
      if (token.status !== 'pending' && token.status !== 'active') {
        return acc;
      }
      acc[token.doctorId] = (acc[token.doctorId] || 0) + 1;
      return acc;
    }, {});

    const doctors = db.doctors.map((doctor) => {
      const settings = db.doctorSettings[doctor.id] || {};
      return {
        ...doctor,
        consultationMode: settings.consultationMode || doctor.consultationMode,
        consultationFee: settings.consultationFee || doctor.consultationFee,
        bookingFee: settings.bookingFee || doctor.bookingFee,
        waitingCount: waitingMap[doctor.id] || 0,
      };
    });

    let filteredDoctors = doctors;

    if (specialty) {
      filteredDoctors = filteredDoctors.filter(doctor => doctor.specialty === specialty);
    }

    if (mode) {
      filteredDoctors = filteredDoctors.filter(doctor => doctor.consultationMode === mode);
    }

    if (search) {
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json(filteredDoctors);
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await readDb();
    const doctor = db.doctors.find((d) => d.id === id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const settings = db.doctorSettings[id] || {};
    res.json({
      ...doctor,
      ...settings,
      qualifications: ['MBBS', 'MD'],
      experience: 10,
      email: `${doctor.name.toLowerCase().replace(/[^a-z]/g, '.')}@clinic.local`,
      phone: '+94 70 000 0000',
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      consultationMode,
      bookingFee,
      consultationFee,
      dailyPatientLimit,
      clinicAddress,
      prescriptionSealName,
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      isAvailableToday,
    } = req.body;

    await updateDb((current) => {
      const existing = current.doctorSettings[id] || {};
      return {
        ...current,
        doctorSettings: {
          ...current.doctorSettings,
          [id]: {
            ...existing,
            consultationMode: consultationMode || existing.consultationMode || 'Hybrid',
            bookingFee: bookingFee ?? existing.bookingFee ?? 100,
            consultationFee: consultationFee ?? existing.consultationFee ?? 450,
            dailyPatientLimit: dailyPatientLimit ?? existing.dailyPatientLimit ?? 20,
            clinicAddress: clinicAddress || existing.clinicAddress || 'Local Clinic Address',
            prescriptionSealName: prescriptionSealName || existing.prescriptionSealName || 'Doctor Seal',
            workingHoursStart: workingHoursStart || existing.workingHoursStart || '08:00',
            workingHoursEnd: workingHoursEnd || existing.workingHoursEnd || '17:00',
            workingDays: workingDays || existing.workingDays || ['Mon','Tue','Wed','Thu','Fri'],
            isAvailableToday: isAvailableToday ?? existing.isAvailableToday ?? true,
            updatedAt: new Date().toISOString(),
          },
        },
        // also toggle doctor's isAvailable if specified
        doctors: current.doctors.map((d) =>
          d.id === id && isAvailableToday !== undefined
            ? { ...d, isAvailable: isAvailableToday }
            : d
        ),
      };
    });

    res.json({
      message: 'Settings updated successfully',
      doctor: {
        id,
        consultationMode: consultationMode || 'Hybrid',
        bookingFee: bookingFee ?? 100,
        consultationFee: consultationFee || 450,
        dailyPatientLimit: dailyPatientLimit || 20,
        clinicAddress: clinicAddress || 'Local Clinic Address',
        prescriptionSealName: prescriptionSealName || 'Doctor Seal',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPsychiatrists = async (req, res, next) => {
  try {
    const db = await readDb();
    const doctors = db.doctors
      .filter(
        (d) =>
          d.isAvailable &&
          (d.specialty.toLowerCase().includes('psych') || d.specialty.toLowerCase().includes('mental'))
      )
      .map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        specialization: d.specialization,
        consultationMode: d.consultationMode,
        bookingFee: d.bookingFee,
        consultationFee: d.consultationFee,
        avatar: d.avatar,
        rating: d.rating,
        isPrivate: true,
        bio: d.bio,
      }));

    res.json(doctors);
  } catch (error) {
    next(error);
  }
};
