import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Doctor, Patient, Token, Consultation, Prescription, Notification, Feedback, SupportTicket } from '../models/index.js';
import {
  sendDoctorRegistrationReceived, sendConsultationAccepted, sendConsultationDenied,
  sendVideoCallReady, sendYourTurnNext
} from '../services/email.service.js';
import { createVideoRoom } from '../services/daily.service.js';
import { emitQueueUpdated, emitTokenAccepted, emitTokenDenied, emitCallReady } from '../socket/queue.socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayEnd = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

export const registerDoctor = async (req, res) => {
  try {
    const { specialization, qualification, clinicName, clinicAddress, consultationType,
      dailyLimit, bookingFee, consultationFee, workingHoursStart, workingHoursEnd, sealName, signature, seal } = req.body;

    const existing = await Doctor.findOne({ user_id: req.user.id });
    if (existing) return res.status(409).json({ message: 'Doctor profile already exists' });

    const doctor = await Doctor.create({
      user_id: req.user.id, specialization, qualification,
      clinic_name: clinicName, clinic_address: clinicAddress,
      consultation_type: consultationType, daily_limit: dailyLimit || 20,
      booking_fee: bookingFee, consultation_fee: consultationFee,
      working_hours_start: workingHoursStart, working_hours_end: workingHoursEnd,
      seal_name: sealName, signature, seal, is_approved: false
    });

    sendDoctorRegistrationReceived(req.user.email, req.user.name).catch(() => { });
    res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.', doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDoctorDashboard = async (req, res) => {
  try {
    let doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor && req.user.role === 'doctor') {
      doctor = await Doctor.create({
        user_id: req.user.id,
        specialization: 'General',
        qualification: 'MBBS',
        clinic_name: 'My Clinic',
        clinic_address: 'Main St, Colombo',
        is_approved: true
      });
    }

    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const todayTokens = await Token.find({
      doctor_id: doctor._id,
      booking_time: { $gte: todayStart(), $lte: todayEnd() }
    })
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ token_number: 1 })
      .lean();

    const tokenIds = todayTokens.map(t => t._id);
    const consultations = await Consultation.find({ token_id: { $in: tokenIds } })
      .populate('prescription') // Need to lookup prescription manually if no ref
      .lean();

    const prescriptions = await Prescription.find({ consultation_id: { $in: consultations.map(c => c._id) } }).lean();

    const queue = todayTokens.map(t => {
      const cons = consultations.find(c => c.token_id.toString() === t._id.toString());
      if (cons) {
        cons.id = cons._id;
        cons.prescription = prescriptions.find(p => p.consultation_id.toString() === cons._id.toString());
        if (cons.prescription) cons.prescription.id = cons.prescription._id;
      }

      const patientName = t.is_anonymous
        ? `Patient #${t._id.toString().substring(0, 6).toUpperCase()}`
        : t.patient_id?.user_id?.name || 'Unknown';

      return { ...t, id: t._id, patientName, patient: t.patient_id, consultation: cons };
    });

    const total = queue.length;
    const completed = queue.filter(t => t.status === 'completed').length;
    const pending = queue.filter(t => t.status === 'waiting').length;
    const serving = queue.filter(t => t.status === 'serving').length;

    res.json({ queue, stats: { total, completed, pending, serving }, doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDoctorSettings = async (req, res) => {
  try {
    const { consultationType, dailyLimit, bookingFee, consultationFee, workingHoursStart, workingHoursEnd, sealName, signature, seal } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { user_id: req.user.id },
      {
        consultation_type: consultationType,
        daily_limit: dailyLimit,
        booking_fee: bookingFee,
        consultation_fee: consultationFee,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        seal_name: sealName,
        signature,
        seal,
      },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    res.json({ message: 'Settings updated', doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const acceptToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    const token = await Token.findOne({ _id: tokenId, doctor_id: doctor._id }).populate({ path: 'patient_id', populate: { path: 'user_id' } });
    if (!token) return res.status(404).json({ message: 'Token not found' });

    token.status = 'waiting';
    await token.save();

    const consultation = await Consultation.findOne({ token_id: token._id });
    if (consultation) {
      consultation.status = 'accepted';
      await consultation.save();
    }

    const patientUser = token.patient_id.user_id;
    emitTokenAccepted(token.patient_id._id, { tokenId, consultationId: consultation?._id });
    const patientName = token.is_anonymous ? '' : patientUser.name;
    sendConsultationAccepted(patientUser.email, patientName, doctor.seal_name || 'Doctor', token.token_number).catch(() => { });

    res.json({ message: 'Token accepted', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const denyToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    const token = await Token.findOne({ _id: tokenId, doctor_id: doctor._id }).populate({ path: 'patient_id', populate: { path: 'user_id' } });
    if (!token) return res.status(404).json({ message: 'Token not found' });

    token.status = 'denied';
    await token.save();

    const consultation = await Consultation.findOne({ token_id: token._id });
    if (consultation) {
      consultation.status = 'denied';
      await consultation.save();
    }

    const patientUser = token.patient_id.user_id;
    emitTokenDenied(token.patient_id._id, { tokenId, message: 'Your consultation has been denied by the doctor' });
    sendConsultationDenied(patientUser.email, patientUser.name, doctor.seal_name || 'Doctor').catch(() => { });

    res.json({ message: 'Token denied', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const nextToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const doctor = await Doctor.findOne({ user_id: req.user.id });

    // Complete the currently serving token
    const serving = await Token.findOne({ doctor_id: doctor._id, status: 'serving' });
    if (serving) {
      serving.status = 'completed';
      await serving.save();
      const servingConsult = await Consultation.findOne({ token_id: serving._id });
      if (servingConsult && servingConsult.status !== 'completed') {
        servingConsult.status = 'completed';
        servingConsult.ended_at = new Date();
        await servingConsult.save();
      }
    }

    // Set new token to serving
    const token = await Token.findOne({ _id: tokenId, doctor_id: doctor._id }).populate({ path: 'patient_id', populate: { path: 'user_id' } });
    if (!token) return res.status(404).json({ message: 'Token not found' });

    token.status = 'serving';
    await token.save();

    const consultation = await Consultation.findOne({ token_id: token._id });

    // Recalculate queue positions
    const waitingTokens = await Token.find({
      doctor_id: doctor._id, status: 'waiting', booking_time: { $gte: todayStart(), $lte: todayEnd() }
    }).sort({ token_number: 1 });

    for (let i = 0; i < waitingTokens.length; i++) {
      waitingTokens[i].queue_position = i + 1;
      await waitingTokens[i].save();
    }

    // Emit queue update
    const allActive = await Token.find({
      doctor_id: doctor._id, booking_time: { $gte: todayStart(), $lte: todayEnd() }, status: { $in: ['waiting', 'serving'] }
    }).sort({ token_number: 1 });
    emitQueueUpdated(doctor._id, allActive);

    const patientUser = token.patient_id.user_id;

    if (token.consultation_mode === 'online' && consultation) {
      const roomUrl = await createVideoRoom(consultation._id);
      consultation.video_room_url = roomUrl;
      consultation.status = 'accepted';
      consultation.started_at = new Date();
      await consultation.save();

      emitCallReady(token.patient_id._id, roomUrl);
      sendVideoCallReady(patientUser.email, patientUser.name, roomUrl).catch(() => { });
    } else {
      sendYourTurnNext(patientUser.email, patientUser.name, doctor.seal_name || 'Doctor').catch(() => { });
    }

    res.json({ message: 'Next patient called', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startConsultation = async (req, res) => {
  try {
    const { consultationId } = req.body;
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    if (!consultation.video_room_url || consultation.video_room_url.includes('demo.daily.co')) {
      const roomUrl = await createVideoRoom(consultationId);
      consultation.video_room_url = roomUrl;
      consultation.started_at = new Date();
      consultation.status = 'accepted';
      await consultation.save();
    }

    res.json({ video_room_url: consultation.video_room_url, consultation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const endConsultation = async (req, res) => {
  try {
    const { consultationId } = req.body;
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    consultation.status = 'completed';
    consultation.ended_at = new Date();
    await consultation.save();

    const token = await Token.findById(consultation.token_id);
    if (token) {
      token.status = 'completed';
      await token.save();
    }

    res.json({ message: 'Consultation ended', consultation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const issuePrescription = async (req, res) => {
  try {
    const { consultationId, medicines, notes, uploadedPrescription } = req.body;
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    if (!doctor.signature || !doctor.seal) {
      return res.status(400).json({
        message: "Please upload your signature and official stamp/seal in settings before issuing a prescription."
      });
    }

    const consultation = await Consultation.findOne({
      _id: consultationId, doctor_id: doctor._id, status: 'completed'
    });
    if (!consultation) return res.status(400).json({ message: 'Consultation not completed or not found' });

    const existing = await Prescription.findOne({ consultation_id: consultationId });
    if (existing) return res.status(409).json({ message: 'Prescription already issued for this consultation' });

    const token = await Token.findById(consultation.token_id);
    const isPhysical = token?.consultation_mode === 'physical' || consultation.type === 'physical';

    const prescription = await Prescription.create({
      consultation_id: consultationId,
      doctor_id: doctor._id,
      patient_id: consultation.patient_id,
      medicines: medicines || [], notes: notes || '', 
      is_locked: isPhysical ? false : true, 
      issued_at: new Date()
    });

    if (uploadedPrescription) {
      const matches = uploadedPrescription.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        let ext = 'pdf';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
        
        const uploadsDir = path.join(__dirname, '../../uploads/prescriptions');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const filePath = path.join(uploadsDir, `${prescription._id}.${ext}`);
        fs.writeFileSync(filePath, buffer);
        prescription.pdf_url = filePath;
        await prescription.save();
      }
    }

    consultation.prescription = prescription._id;
    await consultation.save();

    // Notify patient
    const patient = await Patient.findById(consultation.patient_id);
    await Notification.create({
      user_id: patient.user_id,
      type: 'prescription_ready',
      message: 'Your prescription is ready — please pay consultation fee to access it',
    });

    res.status(201).json({ prescriptionId: prescription._id, message: 'Prescription issued successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDoctorFeedback = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return res.json([]);

    const feedbacks = await Feedback.find({ doctor_id: doctor._id })
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ submitted_at: -1 })
      .lean();

    res.json(feedbacks.map(f => ({ ...f, id: f._id, patient: f.patient_id })));
  } catch (err) {
    console.error('[ERROR] getDoctorFeedback:', err);
    res.status(500).json({ message: err.message });
  }
};

export const doctorCreateSupportTicket = async (req, res) => {
  try {
    const { issueType, description } = req.body;
    const ticket = await SupportTicket.create({ user_id: req.user.id, issue_type: issueType, description });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDoctorSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();
    res.json(tickets.map(t => ({ ...t, id: t._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDoctorNotifications = async (req, res) => {
  try {
    const { markRead } = req.query;
    const notifications = await Notification.find({ user_id: req.user.id }).sort({ sent_at: -1 });
    if (markRead === 'true') {
      await Notification.updateMany({ user_id: req.user.id, is_read: false }, { is_read: true });
    }
    res.json(notifications.map(n => ({ ...n.toObject(), id: n._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
