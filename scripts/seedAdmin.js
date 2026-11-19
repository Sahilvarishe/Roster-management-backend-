import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

export const seedAdminUsers = async () => {
  try {
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@datastraw.io').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@12345';

    // 1. Check if Admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        isActive: true,
        mustChangePassword: false
      });
      console.log(`[Auth Seed] Primary Admin account seeded for: ${adminEmail}`);
    } else {
      console.log(`[Auth Seed] Primary Admin account already exists (${adminEmail}).`);
    }

    // 2. Seed representative demo accounts for the other 3 roles if they don't exist yet
    const demoAccounts = [
      {
        name: 'Alex Mercer',
        email: 'ops.manager@datastraw.io',
        password: process.env.OPS_INITIAL_PASSWORD || 'Ops@12345',
        role: 'operations_manager',
        isActive: true,
        mustChangePassword: false
      },
      {
        name: 'Sarah Jenkins',
        email: 'pod.lead@datastraw.io',
        password: process.env.LEAD_INITIAL_PASSWORD || 'Lead@12345',
        role: 'pod_lead',
        podId: 'Pod Alpha (Inbound Core)',
        employeeId: 'EMP001',
        isActive: true,
        mustChangePassword: false
      },
      {
        name: 'Rahul Sharma',
        email: 'employee@datastraw.io',
        password: process.env.EMP_INITIAL_PASSWORD || 'Emp@12345',
        role: 'employee',
        employeeId: 'EMP002',
        podId: 'Pod Alpha (Inbound Core)',
        isActive: true,
        mustChangePassword: false
      }
    ];

    for (const demo of demoAccounts) {
      const exists = await User.findOne({ email: demo.email });
      if (!exists) {
        const hash = await bcrypt.hash(demo.password, 10);
        await User.create({
          name: demo.name,
          email: demo.email,
          passwordHash: hash,
          role: demo.role,
          podId: demo.podId || null,
          employeeId: demo.employeeId || null,
          isActive: demo.isActive,
          mustChangePassword: false
        });
        console.log(`[Auth Seed] Demo ${demo.role} account seeded: ${demo.email}`);
      }
    }
  } catch (error) {
    console.error('[Auth Seed Error] Failed to seed users:', error.message);
  }
};

// If run standalone via `node scripts/seedAdmin.js`
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seedAdmin.js')) {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/management_system';
  mongoose
    .connect(uri)
    .then(async () => {
      console.log('[Seed Script] Connected to MongoDB. Seeding Admin & Auth accounts...');
      await seedAdminUsers();
      await mongoose.connection.close();
      console.log('[Seed Script] Admin seeding complete. Process exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Script Error] Connection failed:', err.message);
      process.exit(1);
    });
}
