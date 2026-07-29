import { User, Doctor, Patient, Token, Consultation, Prescription, Payment, Notification } from '../models/index.js';
import { generatePayHereHash, verifyPayHereCallback } from '../services/payment.service.js';
import { generatePrescriptionPDF } from '../services/pdf.service.js';
import { sendPrescriptionReady } from '../services/email.service.js';
import { emitPrescriptionUnlocked } from '../socket/queue.socket.js';

export const initiatePayment = async (req, res) => {
  try {
    const { doctorId, type, tokenId } = req.body;
    const patientUser = await User.findById(req.user.id);
    if (!patientUser) return res.status(404).json({ message: 'User profile not found' });

    let patient = await Patient.findOne({ user_id: req.user.id });
    if (!patient) {
      patient = await Patient.create({ user_id: req.user.id }).catch(() => null);
      if (!patient) patient = await Patient.findOne({ user_id: req.user.id });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (tokenId && tokenId !== 'none') {
      const existingSuccess = await Payment.findOne({
        token_id: tokenId,
        type,
        status: 'success'
      });
      if (existingSuccess) {
        return res.status(400).json({ message: 'Payment has already been successfully made for this session' });
      }
    }

    const fee = type === 'booking' ? (doctor.booking_fee || 0) : (doctor.consultation_fee || 1500);
    const amount = parseFloat(fee);

    const payment = await Payment.create({
      patient_id: patient._id,
      token_id: tokenId || null,
      amount, type, status: 'pending'
    });

    const hash = generatePayHereHash(payment._id.toString(), amount.toFixed(2), 'LKR');

    const clientUrl = process.env.CLIENT_URL || 'https://aaro-medi.web.app';
    const serverUrl = process.env.SERVER_URL || 'https://aaro-med.vercel.app';
    const merchantId = process.env.PAYHERE_MERCHANT_ID || '1228422';

    const fullName = patientUser.name || 'Patient User';
    const nameParts = fullName.split(' ');

    const payhereParams = {
      sandbox: process.env.PAYHERE_SANDBOX === 'true' || true,
      merchant_id: merchantId,
      return_url: `${clientUrl}/payment/success`,
      cancel_url: `${clientUrl}/payment/cancel`,
      notify_url: `${serverUrl}/api/payment/notify`,
      order_id: payment._id.toString(),
      items: type === 'booking' ? `Booking Fee — ${doctor.clinic_name || 'Clinic'}` : `Consultation Fee — ${doctor.clinic_name || 'Clinic'}`,
      amount: amount.toFixed(2),
      currency: 'LKR',
      hash,
      first_name: nameParts[0] || 'Patient',
      last_name: nameParts.slice(1).join(' ') || 'User',
      email: patientUser.email || 'patient@example.com',
      phone: patient?.phone || '0770000000',
      address: 'Medical Center',
      city: 'Colombo',
      country: 'Sri Lanka',
    };

    res.json({ payment: { ...payment.toObject(), id: payment._id }, payhereParams });
  } catch (err) {
    console.error('[PAYMENT ERROR] initiatePayment:', err);
    res.status(500).json({ message: err.message });
  }
};

export const payhereNotify = async (req, res) => {
  try {
    const params = req.body;
    const isValid = verifyPayHereCallback(params);

    if (!isValid && process.env.PAYHERE_MERCHANT_SECRET !== 'your_payhere_merchant_secret') {
      return res.status(400).send('Invalid signature');
    }

    const { order_id, status_code, payment_id } = params;

    const payment = await Payment.findById(order_id);
    if (!payment) return res.status(404).send('Payment not found');

    if (status_code === '2') {
      payment.status = 'success';
      payment.payhere_transaction_id = payment_id;
      payment.paid_at = new Date();
      await payment.save();

      if (payment.type === 'consultation' && payment.token_id) {
        const consultation = await Consultation.findOne({ token_id: payment.token_id });
        if (consultation) {
          const prescription = await Prescription.findOne({ consultation_id: consultation._id });
          if (prescription) {
            prescription.is_locked = false;
            await prescription.save();

            // Generate PDF
            const patientRecord = await Patient.findById(payment.patient_id).populate('user_id');
            const token = await Token.findById(payment.token_id);
            const doctor = await Doctor.findById(prescription.doctor_id).populate('user_id');

            const patientName = token?.is_anonymous ? 'Anonymous Patient' : patientRecord?.user_id?.name || 'Patient';

            try {
              const filePath = await generatePrescriptionPDF({
                prescriptionId: prescription._id.toString(),
                doctorName: doctor.user_id.name,
                specialization: doctor.specialization,
                clinicName: doctor.clinic_name,
                sealName: doctor.seal_name || doctor.user_id.name,
                signature: doctor.signature,
                seal: doctor.seal,
                patientName,
                medicines: prescription.medicines,
                notes: prescription.notes,
                issuedAt: prescription.issued_at,
              });
              prescription.pdf_url = filePath;
              await prescription.save();
            } catch (pdfErr) {
              console.error('[PDF ERROR]', pdfErr.message);
            }

            emitPrescriptionUnlocked(payment.patient_id, prescription._id);
            sendPrescriptionReady(patientRecord?.user_id?.email, patientName, doctor.user_id.name).catch(() => {});
          }
        }
      }
    } else if (status_code === '0' || status_code === '-1' || status_code === '-2' || status_code === '-3') {
      payment.status = 'failed';
      await payment.save();
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[PAYHERE NOTIFY]', err);
    res.status(500).send('Error');
  }
};

// Demo sandbox payment - marks payment as successful (for demo/testing)
export const demoPaymentSuccess = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status === 'success') {
      return res.status(400).json({ message: 'This payment has already been completed successfully.' });
    }

    if (payment.token_id && payment.token_id !== 'none') {
      const alreadyPaid = await Payment.findOne({
        token_id: payment.token_id,
        type: payment.type,
        status: 'success',
        _id: { $ne: payment._id }
      });
      if (alreadyPaid) {
        return res.status(400).json({ message: 'A successful payment already exists for this session' });
      }
    }

    payment.status = 'success';
    payment.paid_at = new Date();
    payment.payhere_transaction_id = `DEMO-${Date.now()}`;
    await payment.save();

    if (payment.type === 'consultation' && payment.token_id) {
      const consultation = await Consultation.findOne({ token_id: payment.token_id });
      if (consultation) {
        const prescription = await Prescription.findOne({ consultation_id: consultation._id });
        if (prescription) {
          prescription.is_locked = false;
          await prescription.save();
          emitPrescriptionUnlocked(payment.patient_id, prescription._id);
        }
      }
    }

    res.json({ message: 'Demo payment successful', payment: { ...payment.toObject(), id: payment._id } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { tokenId, type } = req.params;
    const patient = await Patient.findOne({ user_id: req.user.id });

    if (!patient) return res.status(400).json({ message: 'Patient profile not found' });

    let payment = null;
    if (tokenId === 'none') {
      // Booking fee payment (before token created)
      payment = await Payment.findOne({ patient_id: patient._id, type, status: 'success' }).sort({ created_at: -1 });
    } else {
      payment = await Payment.findOne({ patient_id: patient._id, token_id: tokenId, type, status: 'success' });
    }

    res.json({ paid: !!payment, payment: payment ? { ...payment.toObject(), id: payment._id } : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
