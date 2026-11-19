import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    designation: { type: String, required: true, default: 'Support Executive' },
    role: { type: String, default: '' }, // alias / compatibility
    brand: { type: String, required: true, default: 'Apex Retail' },
    pod: { type: String, required: true, default: 'Pod Alpha (Inbound Core)' },
    process: { type: String, required: true, default: 'L1 Inbound Voice Support' },
    joiningDate: { type: String, default: '01-01-2026' },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active'
    },
    shift: { type: String, default: 'Day (08:00 - 17:00)' },
    phone: { type: String, default: '+1 555-0199' },
    address: { type: String, default: '742 Evergreen Terrace, Sector 4' },
    avatar: { type: String, default: '' },
    weeklyOffDays: { type: [String], default: ['Saturday', 'Sunday'] },
    emergencyContact: {
      name: { type: String, default: 'Primary Relative' },
      relation: { type: String, default: 'Spouse / Parent' },
      phone: { type: String, default: '+1 555-0100' }
    },
    skills: { type: [String], default: ['Customer Operations', 'SLA Adherence', 'Incident Escalations'] }
  },
  { timestamps: true }
);

// Virtual to ensure designation / role sync
employeeSchema.pre('save', function (next) {
  if (this.designation && !this.role) this.role = this.designation;
  if (this.role && !this.designation) this.designation = this.role;
  next();
});

export default mongoose.model('Employee', employeeSchema);
