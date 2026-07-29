import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  token_number: { type: Number, required: true },
  consultation_mode: { type: String, enum: ['online', 'physical'], required: true },
  status: { type: String, enum: ['waiting', 'serving', 'completed', 'cancelled', 'denied'], default: 'waiting' },
  booking_time: { type: Date, default: Date.now },
  is_anonymous: { type: Boolean, default: false },
  queue_position: { type: Number },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

tokenSchema.virtual('id').get(function() { return this._id.toHexString(); });
tokenSchema.set('toJSON', { virtuals: true });
tokenSchema.set('toObject', { virtuals: true });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
