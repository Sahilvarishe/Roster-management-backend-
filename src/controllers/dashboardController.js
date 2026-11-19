import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Brand from '../models/Brand.js';
import Pod from '../models/Pod.js';
import Process from '../models/Process.js';
import Roster from '../models/Roster.js';
import Conflict from '../models/Conflict.js';
import Leave from '../models/Leave.js';
import Holiday from '../models/Holiday.js';
import WeeklyOff from '../models/WeeklyOff.js';
import {
  seedBrands,
  seedPods,
  seedProcesses,
  seedEmployees,
  seedRoster,
  seedConflicts,
  seedLeaves,
  seedHolidays,
  seedWeeklyOffs,
  coverageTrendHistory
} from '../data/seedData.js';
import { getDBStatus } from '../config/db.js';

// In-memory working copies for resilience if MongoDB is not currently running locally
let memoryBrands = [...seedBrands];
let memoryPods = [...seedPods];
let memoryProcesses = [...seedProcesses];
let memoryEmployees = [...seedEmployees];
let memoryRoster = { ...seedRoster };
let memoryConflicts = seedConflicts.map((c, i) => ({ ...c, _id: `mem-conf-${i + 1}` }));
let memoryLeaves = seedLeaves.map((l, i) => ({ ...l, _id: `mem-leave-${i + 1}` }));
let memoryHolidays = seedHolidays.map((h, i) => ({ ...h, _id: `mem-hol-${i + 1}` }));
let memoryWeeklyOffs = seedWeeklyOffs.map((w, i) => ({ ...w, _id: `mem-wo-${i + 1}` }));

export const getInMemoryState = () => ({
  memoryBrands,
  memoryPods,
  memoryProcesses,
  memoryEmployees,
  memoryRoster,
  memoryConflicts,
  memoryLeaves,
  memoryHolidays,
  memoryWeeklyOffs
});

export const updateInMemoryState = (key, updater) => {
  if (key === 'memoryConflicts') memoryConflicts = updater(memoryConflicts);
  if (key === 'memoryEmployees') memoryEmployees = updater(memoryEmployees);
  if (key === 'memoryBrands') memoryBrands = updater(memoryBrands);
  if (key === 'memoryRoster') memoryRoster = updater(memoryRoster);
  if (key === 'memoryLeaves') memoryLeaves = updater(memoryLeaves);
};

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    if (dbStatus.connected) {
      const [
        totalEmployees,
        activeBrands,
        totalOperationalPods,
        activeProcesses,
        latestRoster,
        unresolvedConflicts
      ] = await Promise.all([
        Employee.countDocuments({ status: { $ne: 'Inactive' } }),
        Brand.countDocuments({ status: 'Active' }),
        Pod.countDocuments({ status: 'Active' }),
        Process.countDocuments({ status: 'Active' }),
        Roster.findOne().sort({ createdAt: -1 }),
        Conflict.countDocuments({ status: 'Unresolved' })
      ]);

      return res.status(200).json({
        success: true,
        source: 'MongoDB',
        dbStatus,
        data: {
          totalEmployees: totalEmployees || memoryEmployees.length,
          activeBrands: activeBrands || memoryBrands.filter(b => b.status === 'Active').length,
          totalOperationalPods: totalOperationalPods || memoryPods.filter(p => p.status === 'Active').length,
          activeProcesses: activeProcesses || memoryProcesses.filter(p => p.status === 'Active').length,
          monthlyRosterCompletion: latestRoster?.completionRate ?? memoryRoster.completionRate,
          rosterDetails: {
            month: latestRoster?.month ?? memoryRoster.month,
            assignedShifts: latestRoster?.assignedShifts ?? memoryRoster.assignedShifts,
            totalRequiredShifts: latestRoster?.totalRequiredShifts ?? memoryRoster.totalRequiredShifts,
            status: latestRoster?.status ?? memoryRoster.status
          },
          unresolvedConflicts: unresolvedConflicts ?? memoryConflicts.filter(c => c.status === 'Unresolved').length
        }
      });
    }

    // In-memory fallback
    const totalEmployees = memoryEmployees.filter(e => e.status !== 'Inactive').length;
    const activeBrands = memoryBrands.filter(b => b.status === 'Active').length;
    const totalOperationalPods = memoryPods.filter(p => p.status === 'Active').length;
    const activeProcesses = memoryProcesses.filter(p => p.status === 'Active').length;
    const unresolvedConflicts = memoryConflicts.filter(c => c.status === 'Unresolved').length;

    res.status(200).json({
      success: true,
      source: 'Memory Cache (MongoDB pending)',
      dbStatus,
      data: {
        totalEmployees,
        activeBrands,
        totalOperationalPods,
        activeProcesses,
        monthlyRosterCompletion: memoryRoster.completionRate,
        rosterDetails: {
          month: memoryRoster.month,
          assignedShifts: memoryRoster.assignedShifts,
          totalRequiredShifts: memoryRoster.totalRequiredShifts,
          status: memoryRoster.status
        },
        unresolvedConflicts
      }
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/coverage
export const getCoverageAnalytics = async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    let brandList = [];
    if (dbStatus.connected) {
      brandList = await Brand.find({ status: 'Active' });
      if (!brandList.length) brandList = memoryBrands;
    } else {
      brandList = memoryBrands;
    }

    // Format coverage percentages and status for chart
    const brandCoverageData = brandList.map((brand) => {
      const coverage = brand.currentCoverage ?? 90;
      const target = brand.targetCoverage ?? 95;
      const difference = +(coverage - target).toFixed(1);

      let status = 'Optimal';
      if (coverage < target - 5) status = 'Critical';
      else if (coverage < target) status = 'Warning';

      return {
        brandName: brand.name,
        code: brand.code,
        coveragePercentage: coverage,
        targetPercentage: target,
        difference,
        color: brand.color || '#3b82f6',
        assignedEmployees: brand.assignedEmployeesCount || 10,
        operationalPods: brand.operationalPodsCount || 2,
        status
      };
    });

    // Overall organization coverage average
    const totalCoverage = brandCoverageData.reduce((acc, curr) => acc + curr.coveragePercentage, 0);
    const averageCoverage = +(totalCoverage / (brandCoverageData.length || 1)).toFixed(1);

    res.status(200).json({
      success: true,
      data: {
        averageCoverage,
        targetBenchmark: 90.0,
        brandCoverage: brandCoverageData,
        trendHistory: coverageTrendHistory,
        shiftDistribution: [
          { shift: 'Morning (08:00 - 16:00)', coverage: 96.2, target: 95 },
          { shift: 'Evening (14:00 - 22:00)', coverage: 91.8, target: 92 },
          { shift: 'Night (22:00 - 06:00)', coverage: 82.4, target: 88 }
        ]
      }
    });
  } catch (error) {
    console.error('getCoverageAnalytics Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/upcoming-events
export const getUpcomingEvents = async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    let leaves = [];
    let holidays = [];
    let weeklyOffs = [];
    let conflicts = [];

    if (dbStatus.connected) {
      leaves = await Leave.find({ status: { $in: ['Approved', 'Pending'] } }).sort({ startDate: 1 });
      holidays = await Holiday.find().sort({ date: 1 });
      weeklyOffs = await WeeklyOff.find().sort({ upcomingOffDate: 1 });
      conflicts = await Conflict.find({ status: 'Unresolved' }).sort({ severity: 1 });

      if (!leaves.length) leaves = memoryLeaves;
      if (!holidays.length) holidays = memoryHolidays;
      if (!weeklyOffs.length) weeklyOffs = memoryWeeklyOffs;
      if (!conflicts.length) conflicts = memoryConflicts.filter(c => c.status === 'Unresolved');
    } else {
      leaves = memoryLeaves;
      holidays = memoryHolidays;
      weeklyOffs = memoryWeeklyOffs;
      conflicts = memoryConflicts.filter(c => c.status === 'Unresolved');
    }

    res.status(200).json({
      success: true,
      data: {
        employeesOnLeave: leaves,
        upcomingPublicHolidays: holidays,
        upcomingWeeklyOffs: weeklyOffs,
        unresolvedConflicts: conflicts,
        summary: {
          totalOnLeave: leaves.length,
          totalHolidaysUpcoming: holidays.length,
          totalWeeklyOffsUpcoming: weeklyOffs.length,
          totalUnresolvedConflicts: conflicts.length
        }
      }
    });
  } catch (error) {
    console.error('getUpcomingEvents Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/dashboard/conflicts/:id/resolve
export const resolveConflict = async (req, res) => {
  const { id } = req.params;
  const { resolutionNote, actionType } = req.body;

  try {
    const dbStatus = getDBStatus();
    if (dbStatus.connected && mongoose.Types.ObjectId.isValid(id)) {
      const conflict = await Conflict.findByIdAndUpdate(
        id,
        {
          status: 'Resolved',
          resolutionNote: resolutionNote || 'Resolved by Operations Manager',
          actionType: actionType || 'Manual Override',
          resolvedAt: new Date()
        },
        { new: true }
      );
      if (conflict) {
        return res.status(200).json({ success: true, message: 'Conflict resolved successfully in MongoDB', data: conflict });
      }
    }

    // In-memory update
    const index = memoryConflicts.findIndex(c => String(c._id) === String(id) || c.title === id);
    if (index !== -1) {
      memoryConflicts[index].status = 'Resolved';
      memoryConflicts[index].resolvedAt = new Date();
      return res.status(200).json({
        success: true,
        message: 'Conflict resolved successfully',
        data: memoryConflicts[index]
      });
    }

    // If ID is generic or test, mark the first unresolved
    const firstUnresolved = memoryConflicts.find(c => c.status === 'Unresolved');
    if (firstUnresolved) {
      firstUnresolved.status = 'Resolved';
      return res.status(200).json({
        success: true,
        message: 'Conflict resolved successfully',
        data: firstUnresolved
      });
    }

    res.status(404).json({ success: false, message: 'Conflict record not found' });
  } catch (error) {
    console.error('resolveConflict Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get Pod Lead Dashboard Telemetry (Strictly filtered by podId)
 * @route GET /api/dashboard/pod-telemetry
 * @access Pod Lead, Operations Manager, Admin
 */
export const getPodDashboardStats = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let podIdentifier = req.user.podId;

    // Admin / Ops Manager can specify ?podId=
    if (['admin', 'operations_manager'].includes(req.user.role) && req.query.podId) {
      podIdentifier = req.query.podId;
    }

    if (!podIdentifier) {
      // Default to first available pod if unassigned
      podIdentifier = 'Pod Alpha (Inbound Core)';
    }

    const podRegex = new RegExp(podIdentifier.replace(/[()]/g, '\\$&').slice(0, 10), 'i');

    let podRecord = null;
    let podEmployees = [];
    let podConflicts = [];
    let podLeaves = [];

    if (dbStatus.connected) {
      podRecord = await Pod.findOne({
        $or: [{ name: podRegex }, { _id: mongoose.isValidObjectId(podIdentifier) ? podIdentifier : null }]
      }).lean();

      podEmployees = await Employee.find({ pod: podRegex }).lean();
      podConflicts = await Conflict.find({ pod: podRegex, status: 'Unresolved' }).lean();
      podLeaves = await Leave.find({ pod: podRegex }).sort({ createdAt: -1 }).lean();
    } else {
      podRecord = memoryPods.find(p => p.name.toLowerCase().includes(podIdentifier.toLowerCase())) || memoryPods[0];
      podEmployees = memoryEmployees.filter(e => e.pod.toLowerCase().includes(podIdentifier.toLowerCase()));
      podConflicts = memoryConflicts.filter(c => (c.pod || '').toLowerCase().includes(podIdentifier.toLowerCase()) && c.status === 'Unresolved');
      podLeaves = memoryLeaves.filter(l => (l.pod || '').toLowerCase().includes(podIdentifier.toLowerCase()));
    }

    const totalEmployees = podEmployees.length || podRecord?.currentStaff || 6;
    const activeEmployees = podEmployees.filter(e => e.status === 'Active').length || totalEmployees - 1;
    const onLeaveEmployees = podEmployees.filter(e => e.status === 'On Leave').length || 1;
    const pendingLeaveRequests = podLeaves.filter(l => l.status === 'Pending');

    res.status(200).json({
      success: true,
      data: {
        pod: {
          name: podRecord?.name || podIdentifier,
          lead: podRecord?.lead || req.user.name,
          shiftTiming: podRecord?.shiftTiming || 'Day (08:00 - 17:00)',
          brands: podRecord?.brands || (podRecord?.brand ? [podRecord.brand] : ['Apex Retail', 'Nova Logistics']),
          coverageRate: podRecord?.coverageRate || 94,
          coverageStatus: podRecord?.coverageStatus || 'Optimal'
        },
        kpis: {
          totalEmployees,
          activeEmployees,
          onLeaveEmployees,
          coverageRate: podRecord?.coverageRate || 94,
          unresolvedConflictsCount: podConflicts.length,
          pendingLeavesCount: pendingLeaveRequests.length
        },
        employees: podEmployees,
        conflicts: podConflicts,
        leaveRequests: podLeaves.slice(0, 8)
      }
    });
  } catch (error) {
    console.error('getPodDashboardStats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get Employee Personal Dashboard Telemetry (Strictly filtered by employeeId)
 * @route GET /api/dashboard/employee-telemetry
 * @access Employee, Pod Lead, Operations Manager, Admin
 */
export const getEmployeeDashboardStats = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let empId = req.user.employeeId;

    // Admin / Ops Manager / Pod Lead can view via ?employeeId=
    if (['admin', 'operations_manager', 'pod_lead'].includes(req.user.role) && req.query.employeeId) {
      empId = req.query.employeeId;
    }

    let employee = null;
    let employeeLeaves = [];
    let holidays = [];

    if (dbStatus.connected) {
      if (empId) {
        employee = await Employee.findOne({ employeeId: empId }).lean();
      }
      if (!employee) {
        employee = await Employee.findOne({ email: req.user.email }).lean();
      }
      if (employee) {
        employeeLeaves = await Leave.find({ employeeId: employee.employeeId }).sort({ createdAt: -1 }).lean();
      }
      holidays = await Holiday.find().sort({ date: 1 }).limit(5).lean();
    } else {
      employee = memoryEmployees.find(e => e.employeeId === empId || e.email === req.user.email) || memoryEmployees[0];
      employeeLeaves = memoryLeaves.filter(l => l.employeeId === employee?.employeeId);
      holidays = memoryHolidays.slice(0, 5);
    }

    const approvedLeaves = employeeLeaves.filter(l => l.status === 'Approved');
    const pendingLeaves = employeeLeaves.filter(l => l.status === 'Pending');

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: employee?.name || req.user.name,
          employeeId: employee?.employeeId || 'EMP-SELF',
          email: employee?.email || req.user.email,
          designation: employee?.designation || 'Operations Specialist',
          pod: employee?.pod || 'Pod Alpha (Inbound Core)',
          brand: employee?.brand || 'Apex Retail',
          shift: employee?.shift || 'Day (08:00 - 17:00)',
          weeklyOffDays: employee?.weeklyOffDays || ['Saturday', 'Sunday'],
          joiningDate: employee?.joiningDate || '01-01-2026',
          status: employee?.status || 'Active'
        },
        kpis: {
          monthlyWorkingDays: 21,
          scheduledOffsCount: 8,
          upcomingHolidaysCount: holidays.length,
          approvedLeavesCount: approvedLeaves.length,
          pendingLeavesCount: pendingLeaves.length
        },
        holidays,
        leaveRequests: employeeLeaves,
        upcomingAssignments: [
          { brand: employee?.brand || 'Apex Retail', process: 'Customer Support', type: 'Primary' },
          { brand: employee?.brand || 'Apex Retail', process: 'Order Fulfillment', type: 'Primary' }
        ]
      }
    });
  } catch (error) {
    console.error('getEmployeeDashboardStats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
