# MediToken — Smart Clinic Queue System
## Complete Feature Implementation Guide

---

## 🏗️ Project Structure

```
doctor/
├── meditoken-backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js         ✅ Auth + roles
│   │   │   ├── doctorController.js       ✅ Doctor management + working hours
│   │   │   ├── tokenController.js        ✅ Token booking + queue advance + email
│   │   │   ├── prescriptionController.js ✅ Digital prescriptions + seals
│   │   │   ├── paymentController.js      ✅ NEW — PayHere integration
│   │   │   ├── feedbackController.js     ✅ NEW — Ratings + issue reports
│   │   │   └── adminController.js        ✅ NEW — Full admin management
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   ├── tokenRoutes.js            ✅ + doctor queue advance routes
│   │   │   ├── prescriptionRoutes.js
│   │   │   ├── paymentRoutes.js          ✅ NEW
│   │   │   ├── feedbackRoutes.js         ✅ NEW
│   │   │   └── adminRoutes.js            ✅ NEW
│   │   ├── services/
│   │   │   ├── localDb.js                ✅ + payments/feedback/issueReports
│   │   │   └── emailService.js           ✅ NEW — Gmail notifications (nodemailer)
│   │   └── server.js                     ✅ All routes registered
│
└── meditoken-frontend/         # React + Vite SPA
    └── src/
        ├── pages/
        │   ├── Home.jsx                  ✅ Landing page
        │   ├── Login.jsx                 ✅ Authentication
        │   ├── Register.jsx              ✅ Registration (patient/doctor/admin)
        │   ├── DoctorsList.jsx           ✅ Search/filter doctors
        │   ├── PsychiatristsList.jsx     ✅ Anonymous mental health queue
        │   ├── Queue.jsx                 ✅ Real-time queue tracking
        │   ├── Dashboard.jsx             ✅ Patient dashboard + Prescriptions tab
        │   ├── DoctorDashboard.jsx       ✅ NEW — Queue mgmt + prescriptions + settings
        │   ├── AdminDashboard.jsx        ✅ NEW — Full admin panel
        │   ├── FeedbackPage.jsx          ✅ NEW — Ratings + issue reports
        │   ├── HelpDesk.jsx              ✅ NEW — FAQs + guides + contact
        │   ├── PaymentPage.jsx           ✅ NEW — PayHere payment tracking
        │   └── TeleConsultDemo.jsx       ✅ Online consultation
        ├── components/
        │   ├── Header.jsx                ✅ Role-aware navigation
        │   └── Toast.jsx                 ✅ Notifications
        └── services/
            └── api.js                    ✅ All endpoints (auth/doctor/token/rx/payment/feedback/admin)
```

---

## ✅ Feature Checklist vs Requirements

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Sequential Token Booking | ✅ Complete | First-come-first-served, daily reset |
| 2 | Doctor Consultation Settings | ✅ Complete | Mode, fees, daily limit, working hours, availability |
| 3 | Doctor Browsing & Search | ✅ Complete | Search by name/specialty, filter by mode |
| 4 | Private Mental Health Module | ✅ Complete | Anonymous queue, online-only, private |
| 5 | Real-Time Queue Management | ✅ Complete | Live position, currently serving, wait time |
| 6 | Digital Prescription System | ✅ Complete | Issue, view, download; digital seal |
| 7 | Online Payment Integration | ✅ Complete | PayHere (LKR), booking + consultation fees |
| 8 | Email Notification System | ✅ Complete | Gmail/nodemailer: token, reminder, prescription, payment |
| 9 | User Authentication | ✅ Complete | JWT, separate roles: patient/doctor/admin |
| 10 | Online Consultation Booking | ✅ Complete | Online/Physical/Hybrid mode selection |
| 11 | Admin Module | ✅ Complete | Users, doctors, tokens, stats, issue resolution |
| 12 | Feedback & Rating System | ✅ Complete | Star ratings, reviews, doctor/system issue reports |
| 13 | Help Desk & Support | ✅ Complete | FAQs, guides, contact, emergency info |

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+
- npm

### Step 1 — Backend Setup
```bash
cd meditoken-backend

# Install dependencies (already present in node_modules)
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your Gmail credentials and PayHere keys (optional for demo)

# Start development server
npm run dev
# → Server: http://localhost:5000
```

### Step 2 — Frontend Setup
```bash
cd meditoken-frontend

npm install
npm run dev
# → App: http://localhost:3000
```

---

## 👥 Test Accounts

Register accounts with these roles at `/register`:
- **Patient**: `role = patient`
- **Doctor**: `role = doctor`
- **Admin**: `role = admin`

### Pre-seeded Doctors (in local-db.json)
| Doctor | Specialty | Mode |
|--------|-----------|------|
| Dr. Priya Krishnan | General Medicine | Hybrid |
| Dr. Rajesh Kumar | General Medicine | Online |
| Dr. Anjali Singh | General Medicine | Physical |
| Dr. Nadeesha Perera | Psychiatry | Online + Physical |
| Dr. Kavinda Fernando | Psychiatry | Online |

---

## 🔌 API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (patient/doctor/admin) |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Current user profile |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | All doctors (search, filter) |
| GET | `/api/doctors/psychiatrists` | Mental health doctors |
| GET | `/api/doctors/:id` | Doctor details |
| PUT | `/api/doctors/:id/settings` | Update settings (doctor only) |

### Tokens
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tokens` | Book token (patient) |
| GET | `/api/tokens/my-tokens` | Patient's tokens |
| GET | `/api/tokens/queue/:doctorId` | Public queue view |
| PUT | `/api/tokens/:id/cancel` | Cancel token |
| GET | `/api/tokens/doctor-queue/:doctorId` | Doctor's queue (doctor/admin) |
| POST | `/api/tokens/advance/:doctorId` | Call next patient (doctor/admin) |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Issue prescription (doctor) |
| GET | `/api/prescriptions` | My prescriptions |
| GET | `/api/prescriptions/:id` | Single prescription |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initiate` | Start PayHere payment (patient) |
| POST | `/api/payments/notify` | PayHere IPN callback |
| POST | `/api/payments/manual` | Mark paid manually (doctor/admin) |
| GET | `/api/payments/my-payments` | Payment history (patient) |
| GET | `/api/payments/all` | All payments (admin) |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback` | Submit rating (patient) |
| GET | `/api/feedback/doctor/:doctorId` | Doctor's reviews (public) |
| POST | `/api/feedback/issue` | Report issue |
| GET | `/api/feedback/all` | All feedback (admin) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/users` | All users |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/doctors` | Add new doctor |
| PATCH | `/api/admin/doctors/:id/availability` | Toggle availability |
| GET | `/api/admin/tokens` | All tokens |
| GET | `/api/admin/issues` | Issue reports |
| PUT | `/api/admin/issues/:id/resolve` | Resolve issue |

---

## 📧 Email Notifications Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Create an app password for "Mail"
4. Set in `.env`:
```
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
```

Notifications are sent for:
- Token booking confirmation
- Queue position updates
- Prescription availability
- Payment confirmation
- Appointment reminders

> **Note**: If `EMAIL_USER`/`EMAIL_PASS` are not set, emails are logged to the console (development mode).

---

## 💳 PayHere Integration Setup

1. Register at [payhere.lk](https://payhere.lk) as a merchant
2. Get your Merchant ID and Merchant Secret
3. Set in `.env`:
```
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_secret
PAYHERE_SANDBOX=true   # false in production
```

> **Demo mode**: In sandbox mode, payments are auto-marked as completed for testing.

---

## 🔐 Role Permissions Summary

| Feature | Patient | Doctor | Admin |
|---------|---------|--------|-------|
| Book token | ✅ | ❌ | ❌ |
| View queue | ✅ | ✅ | ✅ |
| Advance queue | ❌ | ✅ | ✅ |
| Issue prescription | ❌ | ✅ | ❌ |
| View own prescriptions | ✅ | ✅ | ❌ |
| Make payment | ✅ | ❌ | ❌ |
| Rate doctor | ✅ | ❌ | ❌ |
| Report issue | ✅ | ✅ | ✅ |
| Manage settings | ❌ | ✅ | ✅ |
| Admin panel | ❌ | ❌ | ✅ |
