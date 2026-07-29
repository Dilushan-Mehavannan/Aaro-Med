import mongoose from 'mongoose';
import { User, Doctor, Patient, Token } from '../src/models/index.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartdoctor');
  const userCount = await User.countDocuments();
  const doctorCount = await Doctor.countDocuments();
  console.log(`Users: ${userCount}`);
  console.log(`Doctors: ${doctorCount}`);
  const token = await Token.findOne().sort({ created_at: -1 });
  console.log('Latest Token:', JSON.stringify(token, null, 2));
  
  if (token) {
    const patient = await Patient.findById(token.patient_id);
    console.log('Token Patient:', JSON.stringify(patient, null, 2));
  }
  await mongoose.disconnect();
}

checkData();
