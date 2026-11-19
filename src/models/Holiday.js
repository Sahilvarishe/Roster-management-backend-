import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    dayOfWeek: { type: String, default: 'Thursday' },
    applicableRegionOrGroup: { type: String, default: 'All Regions' },
    type: { type: String, enum: ['National', 'Gazetted', 'Regional', 'Optional'], default: 'Gazetted' },
    affectedPods: { type: [String], default: ['All Pods'] },
    isFloating: { type: Boolean, default: false },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Holiday', holidaySchema);
