import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  token_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  type: { type: String, enum: ['online', 'physical'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'denied', 'completed'], default: 'pending' },
  video_room_url: { type: String },
  started_at: { type: Date },
  ended_at: { type: Date },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

consultationSchema.virtual('id').get(function() { return this._id.toHexString(); });
consultationSchema.set('toJSON', { virtuals: true });
consultationSchema.set('toObject', { virtuals: true });

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;
