import mongoose from 'mongoose';

const resourceAssignmentSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    employeeName: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    process: { type: String, required: true, trim: true },
    assignmentType: {
      type: String,
      enum: ['Primary', 'Backup'],
      default: 'Primary',
      required: true
    },
    pod: { type: String, default: 'General Operations' },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    assignedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness: no duplicate assignment for same employee + brand + process
resourceAssignmentSchema.index({ employeeId: 1, brand: 1, process: 1 }, { unique: true });

export default mongoose.model('ResourceAssignment', resourceAssignmentSchema);
