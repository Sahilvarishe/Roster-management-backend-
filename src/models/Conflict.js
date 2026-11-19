import mongoose from 'mongoose';

const conflictSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: String, required: true }, // e.g. "2026-11-20"
    dateFormatted: { type: String, default: 'Nov 20' },
    brand: { type: String, required: true }, // e.g. "Brand Alpha" or "Alpha"
    process: { type: String, required: true }, // e.g. "CS", "NDR", "ACC"
    problem: { type: String, required: true }, // e.g. "No employee available", "Insufficient staff", "Preferred off violated"
    severity: {
      type: String,
      enum: ['Critical', 'Warning', 'High', 'Medium', 'Low'],
      default: 'Critical'
    },
    category: {
      type: String,
      enum: ['Critical coverage gap', 'Double booking', 'Leave conflict', 'Soft warning'],
      default: 'Critical coverage gap'
    },
    employeeName: { type: String, default: 'Multiple / Unassigned' },
    employeeId: { type: String, default: '' },
    pod: { type: String, default: 'General Operations' },
    shift: { type: String, default: 'Day (08:00 - 17:00)' },
    requiredEmployees: { type: Number, default: 1 },
    availableEmployees: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    possibleResolution: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Unresolved', 'In Progress', 'Resolved'],
      default: 'Unresolved'
    },
    conflictType: {
      type: String,
      default: 'Coverage Gap'
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Conflict', conflictSchema);
