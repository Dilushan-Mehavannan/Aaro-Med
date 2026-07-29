import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  ip_address: { type: String },
  timestamp: { type: Date, default: Date.now },
});

systemLogSchema.virtual('id').get(function() { return this._id.toHexString(); });
systemLogSchema.set('toJSON', { virtuals: true });
systemLogSchema.set('toObject', { virtuals: true });

const SystemLog = mongoose.model('SystemLog', systemLogSchema);
export default SystemLog;
