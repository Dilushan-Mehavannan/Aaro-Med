import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['patient', 'doctor', 'psychiatrist', 'admin'], required: true, default: 'patient' },
  gmail_id: { type: String },
  profile_pic: { type: String },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Virtuals to ensure id field acts like PostgreSQL id
userSchema.virtual('id').get(function() { return this._id.toHexString(); });
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
export default User;
