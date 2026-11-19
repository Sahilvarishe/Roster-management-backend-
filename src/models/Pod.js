import mongoose from 'mongoose';

const podSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    lead: { type: String, default: 'Unassigned', trim: true },
    leadId: { type: String, default: '' },
    description: { type: String, default: '' },
    brand: { type: String, default: 'General Operations' },
    brands: [{ type: String, trim: true }],
    shiftTiming: { type: String, default: 'Day (08:00 - 17:00)' },
    status: { type: String, enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
    requiredStaff: { type: Number, default: 8 },
    currentStaff: { type: Number, default: 8 },
    coverageRate: { type: Number, default: 92 },
    coverageStatus: {
      type: String,
      enum: ['Optimal', 'Warning', 'Critical'],
      default: 'Optimal'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Pod', podSchema);
