import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  token_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['booking', 'consultation'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  payhere_transaction_id: { type: String },
  paid_at: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

paymentSchema.virtual('id').get(function() { return this._id.toHexString(); });
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
