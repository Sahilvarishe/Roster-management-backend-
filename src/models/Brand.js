import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    color: { type: String, default: '#3b82f6' },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Inactive'],
      default: 'Active'
    },
    targetCoverage: { type: Number, default: 95 },
    currentCoverage: { type: Number, default: 92 },
    description: { type: String, default: 'Client brand portfolio' }
  },
  { timestamps: true }
);

export default mongoose.model('Brand', brandSchema);
