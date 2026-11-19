import {
  seedBrandsData,
  seedPodsData,
  seedProcessesData,
  seedEmployeesData,
  seedAssignmentsData,
  seedWeeklyOffsData,
  seedHolidaysData,
  seedLeavesData,
  seedConflictsData,
  generateNovemberRosterEntries
} from '../../seeders/seedData.js';

export const seedBrands = seedBrandsData;
export const seedPods = seedPodsData;
export const seedProcesses = seedProcessesData;
export const seedEmployees = seedEmployeesData;
export const seedAssignments = seedAssignmentsData;
export const seedWeeklyOffs = seedWeeklyOffsData;
export const seedHolidays = seedHolidaysData;
export const seedLeaves = seedLeavesData;
export const seedConflicts = seedConflictsData;
export const seedRoster = generateNovemberRosterEntries();

export const coverageTrendHistory = [
  { week: 'Week 44', UrbanNest: 94.0, GlowTheory: 92.5, FitFuel: 93.0, Trendora: 86.0, LuxeLiving: 96.5, DailyDose: 87.0, Target: 92.0 },
  { week: 'Week 45', UrbanNest: 95.5, GlowTheory: 93.8, FitFuel: 94.2, Trendora: 87.5, LuxeLiving: 97.0, DailyDose: 88.0, Target: 92.0 },
  { week: 'Week 46', UrbanNest: 96.0, GlowTheory: 94.5, FitFuel: 95.0, Trendora: 88.0, LuxeLiving: 97.5, DailyDose: 89.0, Target: 92.0 },
  { week: 'Week 47 (Current)', UrbanNest: 96.2, GlowTheory: 95.0, FitFuel: 95.2, Trendora: 89.0, LuxeLiving: 98.0, DailyDose: 90.5, Target: 92.0 }
];
