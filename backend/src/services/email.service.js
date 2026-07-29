import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #2563A8; padding: 30px 40px; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 5px 0 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 35px 40px; color: #1e293b; }
    .body h2 { font-size: 20px; margin-top: 0; color: #2563A8; }
    .info-box { background: #f8fafc; border-left: 4px solid #2563A8; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
    .info-box p { margin: 4px 0; font-size: 15px; }
    .btn { display: inline-block; background: #2563A8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 SmartDoctor</h1>
      <p>Hybrid Token & Consultation System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© 2024 SmartDoctor. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

export const sendEmail = async (to, subject, htmlBody) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"SmartDoctor" <${process.env.GMAIL_USER}>`, to, subject, html: htmlBody });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Error: ${err.message}`);
  }
};

export const sendWelcomeEmail = (to, name) => sendEmail(to, 'Welcome to SmartDoctor!', baseTemplate(`
  <h2>Welcome, ${name}! 👋</h2>
  <p>We're thrilled to have you on <strong>SmartDoctor</strong>. Your account has been created successfully.</p>
  <p>You can now search for doctors, book consultations, and manage your health journey — all in one place.</p>
  <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a>
`));

export const sendTokenConfirmation = (to, name, tokenNumber, doctorName, mode, clinicOrLink) => sendEmail(to, `Booking Confirmed — Token #${tokenNumber}`, baseTemplate(`
  <h2>Your Booking is Confirmed!</h2>
  <p>Hello <strong>${name}</strong>, your consultation token has been issued.</p>
  <div class="info-box">
    <p>🔢 <strong>Token Number:</strong> #${tokenNumber}</p>
    <p>👨‍⚕️ <strong>Doctor:</strong> ${doctorName}</p>
    <p>📋 <strong>Mode:</strong> ${mode === 'online' ? 'Online (Video Call)' : 'Physical Visit'}</p>
    <p>${mode === 'online' ? '🔗 <strong>Link:</strong> ' + clinicOrLink : '📍 <strong>Clinic:</strong> ' + clinicOrLink}</p>
  </div>
  <p>Please arrive/join on time. Track your queue position on your dashboard.</p>
  <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Track Queue</a>
`));

export const sendConsultationAccepted = (to, name, doctorName, tokenNumber) => sendEmail(to, 'Consultation Accepted ✅', baseTemplate(`
  <h2>Great News! Your Consultation is Accepted</h2>
  <p>Hello <strong>${name}</strong>, Dr. ${doctorName} has accepted your consultation request.</p>
  <div class="info-box">
    <p>🔢 <strong>Token:</strong> #${tokenNumber}</p>
    <p>✅ <strong>Status:</strong> Confirmed</p>
  </div>
  <p>Please be ready and keep an eye on your queue position.</p>
  <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
`));

export const sendConsultationDenied = (to, name, doctorName) => sendEmail(to, 'Consultation Update', baseTemplate(`
  <h2>Consultation Status Update</h2>
  <p>Hello <strong>${name}</strong>, we regret to inform you that Dr. ${doctorName} is unable to accept your consultation at this time.</p>
  <p>You may try booking with another available doctor.</p>
  <a href="${process.env.CLIENT_URL}/doctors" class="btn">Find Another Doctor</a>
`));

export const sendYourTurnNext = (to, name, doctorName) => sendEmail(to, '⚡ Your Turn is Next!', baseTemplate(`
  <h2>You're Next in Queue!</h2>
  <p>Hello <strong>${name}</strong>, Dr. ${doctorName} will be calling you shortly.</p>
  <p>Please be ready at the clinic or near your device now.</p>
  <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Open Dashboard</a>
`));

export const sendVideoCallReady = (to, name, roomUrl) => sendEmail(to, '📹 Your Video Call is Ready!', baseTemplate(`
  <h2>Your Video Consultation is Ready</h2>
  <p>Hello <strong>${name}</strong>, your doctor is ready to see you now.</p>
  <a href="${roomUrl}" class="btn">Join Video Call Now</a>
  <p style="margin-top:16px; font-size:13px; color:#64748b;">If the button doesn't work, copy this link: ${roomUrl}</p>
`));

export const sendPrescriptionReady = (to, name, doctorName) => sendEmail(to, '💊 Your Prescription is Ready', baseTemplate(`
  <h2>Prescription Issued</h2>
  <p>Hello <strong>${name}</strong>, Dr. ${doctorName} has issued your prescription.</p>
  <p>You can view and download your prescription PDF from your dashboard.</p>
  <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Download Prescription</a>
`));

export const sendDoctorRegistrationReceived = (to, name) => sendEmail(to, 'Registration Received — Under Review', baseTemplate(`
  <h2>Application Received, ${name}</h2>
  <p>Thank you for registering as a doctor on SmartDoctor. Your application is under review by our admin team.</p>
  <p>You will be notified by email once your application is approved or rejected.</p>
  <p>Typical review time: <strong>1-2 business days</strong>.</p>
`));

export const sendDoctorApproved = (to, name) => sendEmail(to, '🎉 Your Doctor Account is Approved!', baseTemplate(`
  <h2>Congratulations, Dr. ${name}!</h2>
  <p>Your SmartDoctor account has been <strong>approved</strong>. You can now log in and start accepting patient consultations.</p>
  <a href="${process.env.CLIENT_URL}/login" class="btn">Login to Dashboard</a>
`));

export const sendDoctorRejected = (to, name, reason) => sendEmail(to, 'Application Status Update', baseTemplate(`
  <h2>Application Update, ${name}</h2>
  <p>We regret to inform you that your SmartDoctor doctor application could not be approved at this time.</p>
  <div class="info-box">
    <p><strong>Reason:</strong> ${reason}</p>
  </div>
  <p>If you have questions, please contact our support team.</p>
`));

export const sendAnonymousTokenConfirmation = (to, tokenId) => sendEmail(to, 'Anonymous Session Confirmed', baseTemplate(`
  <h2>Your Anonymous Session is Confirmed</h2>
  <p>Your private mental health consultation has been booked. Your identity is fully protected throughout this session.</p>
  <div class="info-box">
    <p>🔒 <strong>Session Reference:</strong> ${tokenId.substring(0, 8).toUpperCase()}</p>
    <p>📋 <strong>Mode:</strong> Online (Video Call)</p>
  </div>
  <p>We take your privacy seriously. No personal information will be shared with the doctor.</p>
  <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Session</a>
`));
