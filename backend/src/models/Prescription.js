import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  consultation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  medicines: { type: Array, default: [] }, // Array of objects
  notes: { type: String },
  is_locked: { type: Boolean, default: true },
  pdf_url: { type: String },
  seal_verified: { type: Boolean, default: true },
  issued_at: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

prescriptionSchema.virtual('id').get(function() { return this._id.toHexString(); });
prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
