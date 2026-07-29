import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

patientSchema.virtual('id').get(function() { return this._id.toHexString(); });
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
