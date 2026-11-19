import mongoose from 'mongoose';

const processSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    pod: { type: String, default: 'Pod Alpha (Inbound Core)', trim: true },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Inactive'],
      default: 'Active'
    },
    minimumStaff: { type: Number, required: true, default: 1 },
    operatingRule: {
      type: String,
      enum: [
        '365-day operation',
        'Sundays off',
        'Public holidays off',
        'Sundays and public holidays off',
        'Custom working days'
      ],
      default: 'Sundays and public holidays off'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    publicHolidaysOff: { type: Boolean, default: true },
    shiftTiming: { type: String, default: 'Day (08:00 - 17:00)' },
    slaTarget: { type: String, default: '99.5%' },
    description: { type: String, default: '' },
    assignedHeadcount: { type: Number, default: 2 }
  },
  { timestamps: true }
);

// Auto-adjust workingDays based on operatingRule
processSchema.pre('save', function (next) {
  if (this.operatingRule === '365-day operation') {
    this.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.publicHolidaysOff = false;
  } else if (this.operatingRule === 'Sundays off') {
    this.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.publicHolidaysOff = false;
  } else if (this.operatingRule === 'Public holidays off') {
    this.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.publicHolidaysOff = true;
  } else if (this.operatingRule === 'Sundays and public holidays off') {
    this.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.publicHolidaysOff = true;
  }
  next();
});

export default mongoose.model('Process', processSchema);
