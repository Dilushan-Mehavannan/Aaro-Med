import { User, Doctor, Patient, Token, Consultation, Prescription, Payment, Notification, Feedback, SupportTicket, SystemLog } from '../models/index.js';
import { sendDoctorApproved, sendDoctorRejected } from '../services/email.service.js';

export const getUsers = async (req, res) => {
  try {
    const { role, is_active, search } = req.query;
    const match = {};
    if (role) match.role = role;
    if (is_active !== undefined) match.is_active = is_active === 'true';
    if (search) match.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const users = await User.aggregate([
      { $match: match },
      { $sort: { created_at: -1 } },
      { $lookup: { from: 'patients', localField: '_id', foreignField: 'user_id', as: 'patient' } },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: 'user_id', as: 'doctor' } },
      { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } }
    ]);

    // Format ids to match original output
    const formatted = users.map(u => {
      u.id = u._id;
      if (u.patient) u.patient.id = u.patient._id;
      if (u.doctor) u.doctor.id = u.doctor._id;
      return u;
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    await User.findByIdAndUpdate(userId, { is_active });
    SystemLog.create({ user_id: req.user.id, action: `ADMIN_UPDATE_USER_STATUS:${userId}:${is_active}`, ip_address: req.ip }).catch(() => {});
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ is_approved: false })
      .populate('user_id', 'name email role created_at')
      .sort({ created_at: -1 }).lean();
      
    const formatted = doctors.map(d => ({ ...d, id: d._id, user: d.user_id }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId).populate('user_id');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.is_approved = true;
    await doctor.save();
    await User.findByIdAndUpdate(doctor.user_id._id, { is_active: true });

    sendDoctorApproved(doctor.user_id.email, doctor.user_id.name).catch(() => {});
    SystemLog.create({ user_id: req.user.id, action: `ADMIN_APPROVE_DOCTOR:${doctorId}`, ip_address: req.ip }).catch(() => {});

    res.json({ message: 'Doctor approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;
    const doctor = await Doctor.findById(doctorId).populate('user_id');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    await User.findByIdAndUpdate(doctor.user_id._id, { is_active: false });

    sendDoctorRejected(doctor.user_id.email, doctor.user_id.name, reason || 'Application did not meet requirements').catch(() => {});
    SystemLog.create({ user_id: req.user.id, action: `ADMIN_REJECT_DOCTOR:${doctorId}`, ip_address: req.ip }).catch(() => {});

    res.json({ message: 'Doctor rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { user_id, action, date_from, date_to, page = 1, limit = 20 } = req.query;
    const match = {};
    if (user_id) match.user_id = user_id;
    if (action) match.action = { $regex: action, $options: 'i' };
    if (date_from || date_to) {
      match.timestamp = {};
      if (date_from) match.timestamp.$gte = new Date(date_from);
      if (date_to) match.timestamp.$lte = new Date(date_to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const count = await SystemLog.countDocuments(match);
    const rows = await SystemLog.find(match)
      .populate('user_id', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formatted = rows.map(r => ({ ...r, id: r._id, user: r.user_id }));
    res.json({ total: count, page: parseInt(page), limit: parseInt(limit), logs: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { date, doctor_id, status } = req.query;
    const match = {};
    if (doctor_id) match.doctor_id = doctor_id;
    if (status) match.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      match.booking_time = { $gte: start, $lte: end };
    }

    const tokens = await Token.find(match)
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ booking_time: -1 })
      .lean();

    // Map to include consultation
    const tokenIds = tokens.map(t => t._id);
    const consultations = await Consultation.find({ token_id: { $in: tokenIds } }).lean();

    const result = tokens.map(t => {
      const cons = consultations.find(c => c.token_id.toString() === t._id.toString());
      return {
        ...t,
        id: t._id,
        consultation: cons,
        patientName: t.is_anonymous ? `Patient #${t._id.toString().substring(0,6).toUpperCase()}` : t.patient_id?.user_id?.name,
        doctorName: t.doctor_id?.user_id?.name,
        doctor: t.doctor_id,
        patient: t.patient_id
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    const { user_id, type, date, markRead } = req.query;
    const match = {};
    if (user_id) match.user_id = user_id;
    if (type) match.type = type;
    if (date) {
      const d = new Date(date);
      match.sent_at = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    const notifications = await Notification.find(match)
      .populate('user_id', 'name email')
      .sort({ sent_at: -1 })
      .lean();
      
    // Mark retrieved notifications as read
    if (markRead === 'true') {
      await Notification.updateMany({ is_read: false }, { is_read: true });
    }
      
    res.json(notifications.map(n => ({ ...n, id: n._id, user: n.user_id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const { doctor_id, rating_min, rating_max } = req.query;
    const match = {};
    if (doctor_id) match.doctor_id = doctor_id;
    if (rating_min || rating_max) {
      match.rating = {};
      if (rating_min) match.rating.$gte = parseInt(rating_min);
      if (rating_max) match.rating.$lte = parseInt(rating_max);
    }
    
    const feedbacks = await Feedback.find(match)
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ submitted_at: -1 })
      .lean();
      
    res.json(feedbacks.map(f => ({ ...f, id: f._id, doctor: f.doctor_id, patient: f.patient_id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const totalConsultations = await Consultation.countDocuments();
    const totalCompleted = await Consultation.countDocuments({ status: 'completed' });
    const totalPending = await Consultation.countDocuments({ status: 'pending' });
    const totalDenied = await Consultation.countDocuments({ status: 'denied' });
    
    const paymentResult = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = paymentResult.length > 0 ? paymentResult[0].total : 0;

    const doctors = await Doctor.find().populate('user_id', 'name').lean();
    const avgRatingPerDoctor = doctors.map(d => ({ doctorName: d.user_id?.name || 'Unknown', rating: parseFloat(d.rating_avg || 0) }));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const consultationsPerDay = await Consultation.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, 
          count: { $sum: 1 } 
      } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } }
    ]);

    res.json({ totalConsultations, totalCompleted, totalPending, totalDenied, totalRevenue, avgRatingPerDoctor, consultationsPerDay });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSupportTickets = async (req, res) => {
  try {
    const { status, issue_type, user_id } = req.query;
    const match = {};
    if (status) match.status = status;
    if (issue_type) match.issue_type = issue_type;
    if (user_id) match.user_id = user_id;

    const tickets = await SupportTicket.find(match)
      .populate('user_id', 'name email role')
      .sort({ created_at: -1 })
      .lean();
      
    res.json(tickets.map(t => ({ ...t, id: t._id, user: t.user_id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSupportTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, response } = req.body;
    
    const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status, response }, { new: true }).populate('user_id');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await Notification.create({
      user_id: ticket.user_id._id,
      type: 'support_update',
      message: `Your support ticket has been updated — Status: ${status}`,
    });

    res.json({ message: 'Ticket updated', ticket: { ...ticket.toObject(), id: ticket._id, user: ticket.user_id } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .populate('consultation_id')
      .sort({ issued_at: -1 })
      .lean();
      
    // Fetch tokens for consultations to check is_anonymous
    const consultationIds = prescriptions.map(p => p.consultation_id?._id).filter(Boolean);
    const consultations = await Consultation.find({ _id: { $in: consultationIds } }).populate('token_id').lean();

    res.json(prescriptions.map(p => {
      const cons = consultations.find(c => c._id.toString() === p.consultation_id?._id?.toString());
      const isAnon = cons?.token_id?.is_anonymous;
      
      return {
        ...p,
        id: p._id,
        doctor: p.doctor_id,
        patient: p.patient_id,
        consultation: p.consultation_id,
        patientName: isAnon ? 'Anonymous Patient' : p.patient_id?.user_id?.name,
        doctorName: p.doctor_id?.user_id?.name
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ created_at: -1 })
      .lean();
      
    res.json(payments.map(p => ({ ...p, id: p._id, patient: p.patient_id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
