import mongoose from 'mongoose';

const weeklyOffSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    brand: { type: String, default: 'General Operations' },
    pod: { type: String, default: 'General Operations' },
    weeklyOffRule: {
      type: String,
      default: 'Sunday'
    },
    scheduledOffDays: { type: [String], default: ['Sunday'] },
    upcomingOffDate: { type: String, default: '2026-11-22' },
    shiftPattern: { type: String, default: 'Individual Schedule Pattern' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('WeeklyOff', weeklyOffSchema);
