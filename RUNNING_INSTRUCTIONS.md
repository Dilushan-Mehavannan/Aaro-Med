# SmartDoctor — Hybrid Token & Consultation System
## Complete Running Instructions (v2.0)

---

## TECH STACK
- **Frontend**: React 18 + Vite + React Router v6 + Socket.io Client
- **Backend**: Node.js + Express.js + Sequelize ORM + Socket.io
- **Database**: PostgreSQL
- **Auth**: Google OAuth2 + JWT
- **Payment**: PayHere Sandbox (Demo mode)
- **Video**: Daily.co SDK (iframe embed)
- **Email**: Nodemailer + Gmail SMTP
- **PDF**: Puppeteer

---

## PREREQUISITES

### 1. Install Node.js (v18+)
Download from: https://nodejs.org

### 2. Install PostgreSQL
- Download from: https://www.postgresql.org/download/
- Create database: `createdb smartdoctor`
- Or in psql: `CREATE DATABASE smartdoctor;`

### 3. (Optional) Google OAuth Client ID
- Go to: https://console.cloud.google.com
- Create OAuth 2.0 credentials
- Add `http://localhost:5173` as authorized origin

### 4. (Optional) Daily.co API Key  
- Sign up at: https://www.daily.co
- Get API key from dashboard

### 5. (Optional) PayHere Merchant Account
- Sign up at: https://www.payhere.lk
- Get sandbox credentials

---

## CONFIGURATION

### Backend (.env) — `meditoken-backend/.env`
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartdoctor
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartdoctor
DB_USER=postgres
DB_PASS=your_postgres_password

JWT_SECRET=your_jwt_secret_here

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_gmail_app_password  # Use App Password, not regular password

PAYHERE_MERCHANT_ID=1228422
PAYHERE_MERCHANT_SECRET=your_payhere_secret
PAYHERE_SANDBOX=true

DAILY_API_KEY=your_daily_api_key

ADMIN_EMAIL=admin@smartdoctor.com
ADMIN_PASSWORD=Admin@2024Secure

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

### Frontend (.env) — `meditoken-frontend/.env`
```env
VITE_API_BASE=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SOCKET_URL=http://localhost:5000
```

---

## STARTING THE APP

### Start Backend
```powershell
cd meditoken-backend
npm run dev
```
- Server starts at: http://localhost:5000
- Database auto-synced on startup
- Health check: http://localhost:5000/api/health

### Start Frontend (separate terminal)
```powershell
cd meditoken-frontend
npm run dev
```
- App available at: http://localhost:5173

---

## DEFAULT CREDENTIALS

### Admin Login
- URL: http://localhost:5173/admin/login
- Email: `admin@smartdoctor.com`
- Password: `Admin@2024Secure`

---

## USER FLOWS

### Patient Flow
1. Visit http://localhost:5173
2. Sign in with Google (select "Patient")
3. Search for doctors → View Profile
4. Click "Book Consultation"
5. Select mode (Online/Physical)
6. Pay booking fee (Demo Sandbox — click "Simulate Payment Success")
7. Token created automatically → Go to Dashboard
8. Track queue in real-time
9. When called (online): Join video call
10. After consultation: Pay consultation fee to unlock prescription
11. Download prescription PDF
12. Submit feedback

### Doctor Flow
1. Visit http://localhost:5173/doctor/register
2. Sign in with Google, fill registration form
3. Admin must approve your application first
4. After approval: Log in → Doctor Dashboard
5. View today's queue
6. Accept/Deny pending tokens
7. Click "Call Next" to serve waiting patients
8. Start video call (online) or physical consultation
9. End consultation
10. Issue prescription (medicines + notes)

### Admin Flow
1. Visit http://localhost:5173/admin/login
2. Login with admin credentials
3. Access all 9 management sections:
   - User Management (activate/deactivate)
   - Doctor Management (approve/reject applications)
   - Appointment Management (view all bookings)
   - Reports (charts, revenue, ratings)
   - Notifications (all system notifications)
   - Feedback (all patient reviews)
   - System Logs (activity audit trail)
   - Help Desk (support tickets)
   - Data & Records (prescriptions, payments)

### Mental Health / Anonymous Flow
1. Visit http://localhost:5173/mental-health
2. Choose a psychiatrist → "Book Anonymously"
3. Flow is identical but name never shown to doctor
4. Prescription PDF shows "Anonymous Patient"

---

## API ENDPOINTS SUMMARY

### Auth
- `POST /api/auth/google` — Google OAuth login
- `POST /api/auth/admin/login` — Admin login
- `GET /api/auth/me` — Get current user

### Patient (requires JWT + patient role)
- `GET /api/patient/doctors` — List doctors (filterable)
- `GET /api/patient/doctors/psychiatrists` — Psychiatrists only
- `GET /api/patient/doctors/:id` — Doctor profile
- `POST /api/patient/tokens` — Create booking token
- `GET /api/patient/tokens/my` — My tokens
- `GET /api/patient/queue/:doctorId` — Queue status
- `GET /api/patient/prescriptions/:id` — View prescription
- `GET /api/patient/prescriptions/:id/download` — Download PDF
- `POST /api/patient/feedback` — Submit feedback
- `GET /api/patient/notifications` — Get notifications
- `POST /api/patient/support` — Submit support ticket

### Doctor (requires JWT + doctor/psychiatrist role)
- `POST /api/doctor/register` — Register as doctor
- `GET /api/doctor/dashboard` — Today's queue + stats
- `PUT /api/doctor/settings` — Update consultation settings
- `PUT /api/doctor/tokens/:id/accept` — Accept patient
- `PUT /api/doctor/tokens/:id/deny` — Deny patient
- `PUT /api/doctor/tokens/:id/next` — Call next patient
- `POST /api/doctor/consultation/start` — Start consultation
- `POST /api/doctor/consultation/end` — End consultation
- `POST /api/doctor/prescriptions` — Issue prescription
- `GET /api/doctor/feedback` — View my feedback
- `POST /api/doctor/support` — Submit support ticket

### Payment (requires JWT)
- `POST /api/payment/initiate` — Initiate PayHere payment
- `POST /api/payment/notify` — PayHere callback (hash-verified)
- `POST /api/payment/demo-success` — Demo sandbox approval
- `GET /api/payment/status/:tokenId/:type` — Check payment status

### Admin (requires JWT + admin role)
- `GET /api/admin/users` — All users
- `PUT /api/admin/users/:id/status` — Activate/deactivate
- `GET /api/admin/doctors/pending` — Pending approvals
- `PUT /api/admin/doctors/:id/approve` — Approve doctor
- `PUT /api/admin/doctors/:id/reject` — Reject doctor
- `GET /api/admin/logs` — System logs (paginated)
- `GET /api/admin/appointments` — All appointments
- `GET /api/admin/reports` — Aggregated statistics
- `GET /api/admin/support-tickets` — All tickets
- `PUT /api/admin/support-tickets/:id` — Update ticket
- `GET /api/admin/prescriptions` — All prescriptions
- `GET /api/admin/payments` — All payments

---

## SOCKET.IO EVENTS

### Client → Server
- `join:patient` (patientId) — Join patient's notification room
- `join:doctor` (doctorId) — Join doctor's queue room  
- `join:queue` (doctorId) — Join queue as observer

### Server → Client
- `queue:updated` — Full queue array updated
- `token:accepted` — Patient's token was accepted
- `token:denied` — Patient's token was denied
- `call:ready` — Video room URL ready for patient
- `prescription:unlocked` — Prescription accessible after payment

---

## PAYMENT FLOW (DEMO MODE)

1. Patient clicks "Pay with PayHere"
2. Backend creates Payment record (status: pending)
3. Frontend shows sandbox simulation screen
4. Patient clicks "Simulate Payment Success"
5. Backend marks payment as success
6. For consultation payments: prescription auto-unlocks + PDF generated

---

## EMAIL NOTIFICATIONS SENT

1. Welcome email (new user)
2. Token confirmation (booking success)
3. Consultation accepted
4. Consultation denied
5. Your turn next (physical)
6. Video call ready
7. Prescription ready
8. Doctor registration received
9. Doctor approved
10. Doctor rejected
11. Anonymous session confirmation (no name)

---

## NOTES

- **Puppeteer PDF**: First run may download Chromium (~170MB). PDFs saved to `/uploads/prescriptions/`
- **No real payments**: All payments are sandbox/demo — no real money charged
- **Google OAuth**: App works without real Client ID (tokens decoded manually for testing)
- **Daily.co Video**: Falls back to `demo.daily.co` if API key not set
- **Email**: Skipped gracefully if Gmail credentials not configured (logged to console)
- **DB Auto-sync**: Sequelize syncs all tables on server start with `alter: true`
