import pool from '../config/database.js';

const createTables = async () => {
  try {
    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
        phone VARCHAR(20),
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        verified BOOLEAN DEFAULT false,
        verification_code VARCHAR(6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Patients Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth DATE,
        gender VARCHAR(50),
        nic_number VARCHAR(50),
        blood_group VARCHAR(5),
        address TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        medical_allergies TEXT,
        medical_conditions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Doctors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        slmc_registration VARCHAR(50) UNIQUE NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        qualifications VARCHAR(255),
        experience_years INTEGER,
        clinic_name VARCHAR(255),
        clinic_address TEXT,
        consultation_mode VARCHAR(50) CHECK (consultation_mode IN ('Online', 'Physical', 'Hybrid')),
        booking_fee INTEGER DEFAULT 500,
        consultation_fee INTEGER DEFAULT 2000,
        daily_patient_limit INTEGER DEFAULT 30,
        consultation_start_time TIME,
        consultation_end_time TIME,
        prescription_seal_name VARCHAR(255),
        is_available BOOLEAN DEFAULT true,
        average_rating DECIMAL(3,2),
        consultations_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tokens Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_number INTEGER NOT NULL,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'called', 'serving', 'completed', 'cancelled')),
        consultation_mode VARCHAR(50) CHECK (consultation_mode IN ('Online', 'Physical')),
        booking_fee INTEGER,
        consultation_fee INTEGER,
        reason_for_visit TEXT,
        booking_date DATE DEFAULT CURRENT_DATE,
        consultation_date DATE,
        consultation_time TIME,
        estimated_wait_minutes INTEGER,
        booking_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (booking_payment_status IN ('pending', 'completed', 'failed')),
        consultation_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (consultation_payment_status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Prescriptions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        diagnosis TEXT NOT NULL,
        medications JSONB,
        notes TEXT,
        follow_up_days INTEGER,
        is_locked BOOLEAN DEFAULT true,
        unlock_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (unlock_payment_status IN ('pending', 'completed')),
        pdf_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Queue Status Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS queue_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
        current_serving_token INTEGER DEFAULT 0,
        tokens_completed_today INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date DATE DEFAULT CURRENT_DATE
      );
    `);

    // Payment History Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
        prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) DEFAULT 'LKR',
        payment_type VARCHAR(50) CHECK (payment_type IN ('booking', 'consultation', 'prescription_unlock')),
        payhere_order_id VARCHAR(100),
        payhere_payment_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Email History Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_email VARCHAR(255) NOT NULL,
        recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email_type VARCHAR(100),
        subject VARCHAR(255),
        content TEXT,
        status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reviews/Ratings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_tokens_doctor_date ON tokens(doctor_id, booking_date);
      CREATE INDEX IF NOT EXISTS idx_tokens_patient_date ON tokens(patient_id, booking_date);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_payments_token ON payments(token_id);
      CREATE INDEX IF NOT EXISTS idx_email_history_user ON email_history(recipient_user_id);
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

createTables().then(() => {
  console.log('Database migration completed');
  process.exit(0);
}).catch((error) => {
  console.error('Database migration failed:', error);
  process.exit(1);
});
