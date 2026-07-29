import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue_type: { type: String, enum: ['booking', 'payment', 'technical', 'consultation', 'general'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'closed'], default: 'open' },
  response: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

supportTicketSchema.virtual('id').get(function() { return this._id.toHexString(); });
supportTicketSchema.set('toJSON', { virtuals: true });
supportTicketSchema.set('toObject', { virtuals: true });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
