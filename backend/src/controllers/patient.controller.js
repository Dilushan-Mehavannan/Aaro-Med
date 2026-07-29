import mongoose from 'mongoose';
import { User, Doctor, Patient, Token, Consultation, Prescription, Payment, Notification, Feedback, SupportTicket } from '../models/index.js';
import { sendTokenConfirmation, sendAnonymousTokenConfirmation, sendPrescriptionReady } from '../services/email.service.js';
import { generatePrescriptionPDF } from '../services/pdf.service.js';
import { emitQueueUpdated } from '../socket/queue.socket.js';
import fs from 'fs';
import path from 'path';

// Helpers
const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const todayEnd = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };

export const getDoctors = async (req, res) => {
  try {
    const { specialization, consultation_type, search } = req.query;
    const match = { is_approved: true, is_online: true };
    if (specialization) match.specialization = { $regex: specialization, $options: 'i' };
    if (consultation_type) {
      if (consultation_type === 'online') {
        match.consultation_type = { $in: ['online', 'both'] };
      } else if (consultation_type === 'physical') {
        match.consultation_type = { $in: ['physical', 'both'] };
      } else {
        match.consultation_type = consultation_type;
      }
    }

    const userMatch = { is_active: true };
    if (search) userMatch.name = { $regex: search, $options: 'i' };

    const doctors = await Doctor.find(match).populate({
      path: 'user_id',
      match: userMatch,
      select: 'name email profile_pic role'
    }).lean();

    // Filter out doctors where user didn't match the search
    const filteredDoctors = doctors.filter(d => d.user_id != null);

    const result = await Promise.all(filteredDoctors.map(async (d) => {
      const bookedToday = await Token.countDocuments({
        doctor_id: d._id, booking_time: { $gte: todayStart(), $lte: todayEnd() }, status: { $ne: 'cancelled' }
      });
      return {
        ...d,
        id: d._id,
        user: d.user_id,
        booked_today: bookedToday,
        available_slots: Math.max(0, d.daily_limit - bookedToday),
        is_available: bookedToday < d.daily_limit,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('[ERROR] getDoctors:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId).populate({
      path: 'user_id',
      select: 'name email profile_pic role'
    }).lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const bookedToday = await Token.countDocuments({
      doctor_id: doctor._id, booking_time: { $gte: todayStart(), $lte: todayEnd() }, status: { $ne: 'cancelled' }
    });

    res.json({ ...doctor, id: doctor._id, user: doctor.user_id, booked_today: bookedToday, available_slots: Math.max(0, doctor.daily_limit - bookedToday) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPsychiatrists = async (req, res) => {
  try {
    const doctors = await Doctor.find({ is_approved: true, is_online: true }).populate({
      path: 'user_id',
      match: { is_active: true },
      select: 'name email profile_pic role'
    }).lean();
    
    // Filter to ensure user is active and has psychiatrist role OR Psychiatrist specialization
    const psychiatrists = doctors.filter(d => {
      if (!d.user_id) return false;
      const isPsychiatristRole = d.user_id.role === 'psychiatrist';
      const isPsychiatristSpec = d.specialization && (
        d.specialization.toLowerCase() === 'psychiatrist' ||
        d.specialization.toLowerCase() === 'psychiatry'
      );
      return isPsychiatristRole || isPsychiatristSpec;
    }).map(d => ({ ...d, id: d._id, user: d.user_id }));

    res.json(psychiatrists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createToken = async (req, res) => {
  try {
    const { doctorId, consultationMode, isAnonymous } = req.body;
    const patientUser = await User.findById(req.user.id);
    const patient = await Patient.findOne({ user_id: req.user.id });
    if (!patient) return res.status(400).json({ message: 'Patient profile not found' });

    // Verify booking payment
    const payment = await Payment.findOne({
      patient_id: patient._id, type: 'booking', status: 'success', token_id: null
    }).sort({ created_at: -1 }); // Get the latest unused booking payment
    
    // Or if it was assigned to a specific doctor id or similar, logic can be modified.
    // The previous sequelize code didn't check if token_id is null, it just joined Token where doctor_id.
    // For Mongoose, we'll check if token_id is null.
    if (!payment) {
      // It's possible the payment has token_id populated if we allow multiple tokens per payment. 
      // Assuming a booking payment is 1:1 to a token and starts with null.
      const anyUnusedBookingPayment = await Payment.findOne({ patient_id: patient._id, type: 'booking', status: 'success' });
      if (!anyUnusedBookingPayment) return res.status(402).json({ message: 'Booking fee payment required before creating token' });
    }

    const doctor = await Doctor.findById(doctorId).populate('user_id');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Get next token number for today
    const lastToken = await Token.findOne({
      doctor_id: doctorId, booking_time: { $gte: todayStart(), $lte: todayEnd() }
    }).sort({ token_number: -1 });
    const tokenNumber = lastToken ? lastToken.token_number + 1 : 1;

    // Queue position
    const waitingCount = await Token.countDocuments({
      doctor_id: doctorId, status: 'waiting', booking_time: { $gte: todayStart(), $lte: todayEnd() }
    });

    const token = await Token.create({
      patient_id: patient._id, doctor_id: doctorId,
      token_number: tokenNumber, consultation_mode: consultationMode,
      status: 'waiting', is_anonymous: isAnonymous || false,
      queue_position: waitingCount + 1,
      booking_time: new Date()
    });

    // Update payment with token_id if we found an unused one
    if (payment && !payment.token_id) {
      payment.token_id = token._id;
      await payment.save();
    }

    const consultation = await Consultation.create({
      token_id: token._id, patient_id: patient._id,
      doctor_id: doctorId, type: consultationMode, status: 'pending'
    });

    // Emit queue update
    const queue = await Token.find({
      doctor_id: doctorId, booking_time: { $gte: todayStart(), $lte: todayEnd() }, status: { $in: ['waiting','serving'] }
    }).sort({ token_number: 1 }).lean();
    emitQueueUpdated(doctorId, queue);

    // Send email
    if (isAnonymous) {
      sendAnonymousTokenConfirmation(req.user.email, token._id.toString()).catch(() => {});
    } else {
      sendTokenConfirmation(req.user.email, patientUser.name, tokenNumber, doctor.user_id.name, consultationMode, doctor.clinic_address || doctor.clinic_name).catch(() => {});
    }

    res.status(201).json({ token, consultation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyTokens = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized: No user ID found' });

    const patient = await Patient.findOne({ user_id: userId });
    if (!patient) return res.status(400).json({ message: 'Patient profile not found' });

    const tokens = await Token.find({ patient_id: patient._id })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name email profile_pic' } })
      .sort({ booking_time: -1 })
      .lean();

    const tokenIds = tokens.map(t => t._id);
    const consultations = await Consultation.find({ token_id: { $in: tokenIds } })
      .populate('prescription')
      .lean();

    const prescriptions = await Prescription.find({ consultation_id: { $in: consultations.map(c => c._id) } }).lean();

    const result = tokens.map(t => {
      const cons = consultations.find(c => c.token_id && c.token_id.toString() === t._id.toString());
      if (cons) {
        cons.id = cons._id;
        if (cons.video_room_url && cons.video_room_url.includes('demo.daily.co')) {
          cons.video_room_url = `https://meet.jit.si/smartdoctor-consult-${cons._id}`;
        }
        cons.prescription = prescriptions.find(p => p.consultation_id.toString() === cons._id.toString());
        if (cons.prescription) {
          cons.prescription.id = cons.prescription._id;
          if (t.consultation_mode === 'physical' || cons.type === 'physical') {
            cons.prescription.is_locked = false;
          }
        }
      }
      return { ...t, id: t._id, doctor: t.doctor_id, consultation: cons };
    });

    res.json(result);
  } catch (err) {
    console.error('[ERROR] getMyTokens:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user?.id || req.user?._id;
    const patient = userId ? await Patient.findOne({ user_id: userId }) : null;

    // Explicitly cast to ensure Mongoose recognizes it as an ID
    const queryDoctorId = mongoose.Types.ObjectId.isValid(doctorId) ? new mongoose.Types.ObjectId(doctorId) : doctorId;

    const allTokens = await Token.find({
      doctor_id: queryDoctorId, booking_time: { $gte: todayStart(), $lte: todayEnd() }, status: { $in: ['waiting','serving'] }
    }).sort({ token_number: 1 }).lean();

    const currentServing = allTokens.find(t => t.status === 'serving');
    const myToken = allTokens.find(t => t.patient_id && patient?._id && t.patient_id.toString() === patient._id.toString());
    const tokensAhead = myToken ? allTokens.filter(t => t.token_number < myToken.token_number && t.status === 'waiting').length : 0;

    const result = {
      current_serving_token: currentServing?.token_number || null,
      my_token_number: myToken?.token_number || null,
      tokens_ahead: tokensAhead,
      estimated_wait_minutes: tokensAhead * 10,
      queue: allTokens.map(t => ({
        id: t._id,
        token_number: t.token_number,
        status: t.status
      }))
    };

    res.json(result);
  } catch (err) {
    console.error(`[ERROR] getQueue for URL: ${req.originalUrl}`);
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const patient = await Patient.findOne({ user_id: req.user.id });

    const prescription = await Prescription.findOne({ _id: prescriptionId, patient_id: patient._id })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .populate('consultation_id')
      .lean();
      
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const consultation = prescription.consultation_id;
    const isPhysical = consultation?.type === 'physical';

    let payment = null;
    if (!isPhysical) {
      payment = await Payment.findOne({
        patient_id: patient._id, token_id: consultation?.token_id, type: 'consultation', status: 'success'
      });
    }

    if (!isPhysical && !payment) {
      const doctor = prescription.doctor_id;
      if (doctor) {
        doctor.id = doctor._id;
      }
      return res.status(402).json({
        message: 'Consultation fee payment required to access prescription',
        prescriptionId,
        doctor,
        tokenId: consultation?.token_id
      });
    }

    prescription.id = prescription._id;
    prescription.doctor = prescription.doctor_id;
    prescription.consultation = prescription.consultation_id;
    prescription.is_locked = isPhysical ? false : (payment ? false : true);

    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const downloadPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const patientUser = await User.findById(req.user.id);
    const patient = await Patient.findOne({ user_id: req.user.id });

    const prescription = await Prescription.findOne({ _id: prescriptionId, patient_id: patient._id })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .populate('consultation_id');
      
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const consultation = prescription.consultation_id;
    const isPhysical = consultation?.type === 'physical';

    if (!isPhysical) {
      const payment = await Payment.findOne({
        patient_id: patient._id, token_id: consultation?.token_id, type: 'consultation', status: 'success'
      });
      if (!payment) return res.status(402).json({ message: 'Consultation fee payment required' });
    }

    // Generate PDF if not already generated
    if (!prescription.pdf_url || !fs.existsSync(prescription.pdf_url)) {
      const token = await Token.findById(prescription.consultation_id.token_id);
      const patientName = token?.is_anonymous ? 'Anonymous Patient' : patientUser.name;
      const doctorData = await Doctor.findById(prescription.doctor_id).populate('user_id');
      
      const filePath = await generatePrescriptionPDF({
        prescriptionId: prescription._id.toString(),
        doctorName: doctorData.user_id.name,
        specialization: doctorData.specialization,
        clinicName: doctorData.clinic_name,
        sealName: doctorData.seal_name || doctorData.user_id.name,
        signature: doctorData.signature,
        seal: doctorData.seal,
        patientName,
        medicines: prescription.medicines,
        notes: prescription.notes,
        issuedAt: prescription.issued_at,
      });
      prescription.pdf_url = filePath;
      await prescription.save();
      sendPrescriptionReady(req.user.email, patientUser.name, doctorData.user_id.name).catch(() => {});
    }

    console.log("[DEBUG] prescription.pdf_url is:", prescription.pdf_url);
    const pdfUrl = prescription.pdf_url || '';
    const ext = path.extname(pdfUrl).toLowerCase();
    let contentType = 'application/pdf';
    let cleanExt = 'pdf';
    if (ext === '.png') {
      contentType = 'image/png';
      cleanExt = 'png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
      cleanExt = 'jpg';
    }

    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescriptionId}.${cleanExt}`);
    res.setHeader('Content-Type', contentType);
    const stream = fs.createReadStream(prescription.pdf_url);
    stream.pipe(res);
  } catch (err) {
    console.error("[ERROR] downloadPrescription error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { consultationId, rating, comment, videoQuality, easeOfUse, reportedIssue } = req.body;
    console.log("[DEBUG] submitFeedback req.body:", req.body);
    
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const patient = await Patient.findOne({ user_id: userId });
    console.log("[DEBUG] submitFeedback patient found:", patient);
    if (!patient) return res.status(400).json({ message: 'Patient profile not found' });

    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      return res.status(400).json({ message: 'Invalid consultation ID' });
    }

    const consultation = await Consultation.findOne({ _id: consultationId, patient_id: patient._id });
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    const existing = await Feedback.findOne({ consultation_id: consultationId });
    if (existing) return res.status(409).json({ message: 'Feedback already submitted' });

    const feedback = await Feedback.create({
      patient_id: patient._id, doctor_id: consultation.doctor_id,
      consultation_id: consultationId, rating, comment,
      video_quality: videoQuality, ease_of_use: easeOfUse,
      reported_issue: reportedIssue, submitted_at: new Date()
    });

    // Recalculate doctor rating
    const allFeedback = await Feedback.find({ doctor_id: consultation.doctor_id });
    const avg = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    await Doctor.findByIdAndUpdate(consultation.doctor_id, { rating_avg: avg.toFixed(2) });

    res.json(feedback);
  } catch (err) {
    console.error('[ERROR] submitFeedback:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { markRead } = req.query;
    const notifications = await Notification.find({ user_id: req.user.id }).sort({ sent_at: -1 });
    if (markRead === 'true') {
      await Notification.updateMany({ user_id: req.user.id, is_read: false }, { is_read: true });
    }
    
    // map to id
    res.json(notifications.map(n => ({ ...n.toObject(), id: n._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createSupportTicket = async (req, res) => {
  try {
    const { issueType, description } = req.body;
    const ticket = await SupportTicket.create({ user_id: req.user.id, issue_type: issueType, description });
    res.status(201).json({ ...ticket.toObject(), id: ticket._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    // Check if the saved URL uses demo.daily.co and fix/fallback dynamically if needed
    if (consultation.video_room_url && consultation.video_room_url.includes('demo.daily.co')) {
      consultation.video_room_url = `https://meet.jit.si/smartdoctor-consult-${consultationId}`;
    }

    const feedback = await Feedback.findOne({ consultation_id: consultationId });

    res.json({ 
      ...consultation.toObject(), 
      id: consultation._id, 
      video_room_url: consultation.video_room_url,
      feedback 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPatientSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();
    res.json(tickets.map(t => ({ ...t, id: t._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
