import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  sent_at: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

notificationSchema.virtual('id').get(function() { return this._id.toHexString(); });
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
