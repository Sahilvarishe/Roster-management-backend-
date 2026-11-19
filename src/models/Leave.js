import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    role: { type: String, default: '' },
    brand: { type: String, default: 'General Operations' },
    pod: { type: String, default: 'General Operations' },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'Planned leave', 'Approved leave', 'Comp-off', 'Other unavailability'],
      default: 'Approved leave'
    },
    leaveType: {
      type: String,
      default: 'Annual'
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    dates: [{ type: String }],
    durationDays: { type: Number, default: 1 },
    status: { type: String, enum: ['Approved', 'Pending', 'Rejected', 'Cancelled'], default: 'Pending' },
    reason: { type: String, default: '' },
    reviewedBy: { type: String, default: null },
    reviewerComments: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Leave', leaveSchema);
