import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  consultation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  video_quality: { type: Number, min: 1, max: 5 },
  ease_of_use: { type: Number, min: 1, max: 5 },
  reported_issue: { type: String },
  submitted_at: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

feedbackSchema.virtual('id').get(function() { return this._id.toHexString(); });
feedbackSchema.set('toJSON', { virtuals: true });
feedbackSchema.set('toObject', { virtuals: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
