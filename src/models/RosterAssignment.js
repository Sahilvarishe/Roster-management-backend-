import mongoose from 'mongoose';

const rosterAssignmentSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // e.g. "November 2026"
    monthIndex: { type: Number, required: true }, // 10 (0-indexed) or 11
    year: { type: Number, required: true },
    date: { type: String, required: true }, // "2026-11-19"
    dayOfMonth: { type: Number, required: true }, // 1 - 31
    dayOfWeek: { type: String, required: true }, // "Thu", "Fri", etc.
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    brand: { type: String, required: true },
    pod: { type: String, required: true },
    process: { type: String, required: true },
    status: {
      type: String,
      enum: ['Working', 'Weekly Off', 'Leave', 'Holiday', 'Conflict'],
      default: 'Working'
    },
    shift: {
      type: String,
      default: 'Day (08:00 - 17:00)'
    },
    leaveType: { type: String, default: null },
    holidayName: { type: String, default: null },
    conflictReason: { type: String, default: null },
    notes: { type: String, default: '' },
    modifiedBy: { type: String, default: 'System Generator' }
  },
  { timestamps: true }
);

// Compound index for fast queries by month, year, employee, or date
rosterAssignmentSchema.index({ month: 1, year: 1, employeeId: 1, date: 1 });
rosterAssignmentSchema.index({ month: 1, year: 1, date: 1, process: 1 });

export default mongoose.model('RosterAssignment', rosterAssignmentSchema);
