import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  qualification: { type: String, required: true },
  clinic_name: { type: String, required: true },
  clinic_address: { type: String, required: true },
  consultation_type: { type: String, enum: ['online', 'physical', 'both'], required: true, default: 'both' },
  daily_limit: { type: Number, default: 20 },
  booking_fee: { type: Number, default: 0 },
  consultation_fee: { type: Number, default: 0 },
  working_hours_start: { type: String }, // e.g. "09:00"
  working_hours_end: { type: String }, // e.g. "17:00"
  is_approved: { type: Boolean, default: false },
  seal_name: { type: String },
  signature: { type: String }, // Base64 signature image
  seal: { type: String }, // Base64 official stamp seal image
  rating_avg: { type: Number, default: 0 },
  is_online: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

doctorSchema.virtual('id').get(function() { return this._id.toHexString(); });
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
