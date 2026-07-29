import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });
  }
  // Development: log emails to console instead of sending
  return {
    sendMail: async (options) => {
      console.log('\n📧 [Email Notification - Dev Mode]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text || '(HTML email)'}`);
      console.log('---');
      return { messageId: 'dev-' + Date.now() };
    },
  };
};

const FROM = process.env.EMAIL_FROM || '"MediToken Clinic" <noreply@meditoken.lk>';

// Token confirmation email
export const sendTokenConfirmation = async ({ to, patientName, doctorName, tokenNumber, consultationMode, bookingDate }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `✅ Token #${tokenNumber} Confirmed – MediToken`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#0ea5e9">MediToken – Booking Confirmed</h2>
        <p>Hi <b>${patientName}</b>,</p>
        <p>Your consultation token has been booked successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr><td style="padding:8px;background:#f0f9ff;font-weight:600">Token Number</td><td style="padding:8px;background:#f0f9ff">#${tokenNumber}</td></tr>
          <tr><td style="padding:8px">Doctor</td><td style="padding:8px">${doctorName}</td></tr>
          <tr><td style="padding:8px;background:#f0f9ff">Consultation Mode</td><td style="padding:8px;background:#f0f9ff">${consultationMode}</td></tr>
          <tr><td style="padding:8px">Booked On</td><td style="padding:8px">${new Date(bookingDate).toLocaleString()}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:0.9em">Please arrive on time. Track your queue position in the MediToken app.</p>
        <p style="color:#0ea5e9;font-weight:600">MediToken – Smart Clinic Queue System</p>
      </div>`,
    text: `Token #${tokenNumber} confirmed with ${doctorName} (${consultationMode}). Booked: ${new Date(bookingDate).toLocaleString()}`,
  });
};

// Appointment reminder (could be triggered by a cron job)
export const sendAppointmentReminder = async ({ to, patientName, doctorName, tokenNumber }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `⏰ Reminder: Your Token #${tokenNumber} is coming up – MediToken`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#f59e0b">Appointment Reminder</h2>
        <p>Hi <b>${patientName}</b>,</p>
        <p>This is a reminder for your upcoming consultation:</p>
        <p><b>Token #${tokenNumber}</b> with <b>${doctorName}</b></p>
        <p>Please check the MediToken app for your current queue position.</p>
      </div>`,
  });
};

// Prescription ready notification
export const sendPrescriptionReady = async ({ to, patientName, doctorName, prescriptionId }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `📋 Your Prescription is Ready – MediToken`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#10b981">Prescription Available</h2>
        <p>Hi <b>${patientName}</b>,</p>
        <p>Your digital prescription from <b>${doctorName}</b> is now available.</p>
        <p>Log into MediToken to view and download your prescription (ID: <code>${prescriptionId}</code>).</p>
        <p style="color:#6b7280;font-size:0.9em">Your prescription is securely stored and accessible any time.</p>
      </div>`,
  });
};

// Queue update - notify patient their turn is near
export const sendQueueUpdate = async ({ to, patientName, tokenNumber, position }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `🔔 Token #${tokenNumber} – ${position <= 1 ? 'Your turn is next!' : `${position} patients ahead`}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#8b5cf6">Queue Update</h2>
        <p>Hi <b>${patientName}</b>,</p>
        ${position <= 1
          ? '<p><b>Your turn is next!</b> Please be ready for your consultation.</p>'
          : `<p>You now have <b>${position} patient(s)</b> ahead of you in the queue.</p>`}
        <p>Token Number: <b>#${tokenNumber}</b></p>
      </div>`,
  });
};

// Payment confirmation
export const sendPaymentConfirmation = async ({ to, patientName, amount, paymentType, paymentId }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `💳 Payment Confirmed – Rs. ${amount} – MediToken`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#0ea5e9">Payment Confirmed</h2>
        <p>Hi <b>${patientName}</b>,</p>
        <p>Your payment has been received successfully.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;background:#f0f9ff;font-weight:600">Type</td><td style="padding:8px;background:#f0f9ff">${paymentType === 'booking' ? 'Booking Fee' : 'Consultation Fee'}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Amount</td><td style="padding:8px">Rs. ${amount}</td></tr>
          <tr><td style="padding:8px;background:#f0f9ff;font-weight:600">Reference</td><td style="padding:8px;background:#f0f9ff">${paymentId}</td></tr>
        </table>
      </div>`,
  });
};
