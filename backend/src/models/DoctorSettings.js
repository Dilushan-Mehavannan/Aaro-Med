import mongoose from 'mongoose';

const doctorSettingsSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      unique: true,
    },
    workingHours: {
      startTime: {
        type: String,
        default: '09:00',
      },
      endTime: {
        type: String,
        default: '17:00',
      },
    },
    daysOff: [String],
    dailyLimit: {
      type: Number,
      default: 20,
    },
    consultationFee: Number,
    bookingFee: Number,
    consultationMode: {
      type: String,
      enum: ['Online', 'Physical', 'Hybrid'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('DoctorSettings', doctorSettingsSchema);
