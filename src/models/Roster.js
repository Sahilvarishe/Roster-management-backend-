import mongoose from 'mongoose';

const rosterSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // e.g. "November 2026"
    monthIndex: { type: Number, required: true }, // 10 (0-indexed) or 11
    year: { type: Number, required: true },
    totalRequiredShifts: { type: Number, required: true, default: 480 },
    assignedShifts: { type: Number, required: true, default: 425 },
    completionRate: { type: Number, required: true, default: 88.5 },
    status: { type: String, enum: ['Draft', 'In Review', 'Published', 'Locked'], default: 'Published' },
    lastGeneratedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Roster', rosterSchema);
