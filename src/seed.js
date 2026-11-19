import dotenv from 'dotenv';
import { seedCompleteDatabase } from '../seeders/seedData.js';
import { seedAdminUsers } from '../scripts/seedAdmin.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    await seedAdminUsers();
    await seedCompleteDatabase();
  } catch (error) {
    console.error('[Seed Database Error]:', error.message);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
