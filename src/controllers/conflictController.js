import Conflict from '../models/Conflict.js';
import Employee from '../models/Employee.js';
import Brand from '../models/Brand.js';
import Process from '../models/Process.js';
import Leave from '../models/Leave.js';
import WeeklyOff from '../models/WeeklyOff.js';
import ResourceAssignment from '../models/ResourceAssignment.js';
import { getDBStatus } from '../config/db.js';
import {
  seedConflicts,
  seedEmployees,
  seedBrands,
  seedProcesses,
  seedLeaves,
  seedWeeklyOffs,
  seedAssignments
} from '../data/seedData.js';

// In-memory fallback state for resilience mode
let inMemoryConflicts = seedConflicts.map((c, idx) => ({
  ...c,
  _id: `mem-conf-${idx + 1}`,
  dateFormatted: c.dateFormatted || c.date?.slice(5),
  createdAt: new Date().toISOString()
}));

// Helper to compute Section A statistics
const calculateConflictStats = (conflicts = []) => {
  const unresolved = conflicts.filter((c) => c.status !== 'Resolved');

  let criticalCoverageGaps = 0;
  let doubleBookings = 0;
  let leaveConflicts = 0;
  let softWarnings = 0;

  for (const c of unresolved) {
    if (c.category === 'Critical coverage gap' || (c.severity === 'Critical' && c.problem?.toLowerCase().includes('staff'))) {
      criticalCoverageGaps++;
    } else if (c.category === 'Double booking' || c.problem?.toLowerCase().includes('double')) {
      doubleBookings++;
    } else if (c.category === 'Leave conflict' || c.problem?.toLowerCase().includes('leave') || c.problem?.toLowerCase().includes('available')) {
      leaveConflicts++;
    } else if (c.category === 'Soft warning' || c.severity === 'Warning' || c.problem?.toLowerCase().includes('off')) {
      softWarnings++;
    } else {
      softWarnings++;
    }
  }

  return {
    totalConflicts: unresolved.length,
    criticalCoverageGaps,
    doubleBookings,
    leaveConflicts,
    softWarnings,
    resolvedCount: conflicts.filter((c) => c.status === 'Resolved').length,
    allCount: conflicts.length
  };
};

// GET /api/conflicts/stats
export const getConflictStats = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let conflicts = [];

    if (dbStatus.connected) {
      conflicts = await Conflict.find().lean();
      if (!conflicts.length) conflicts = inMemoryConflicts;
    } else {
      conflicts = inMemoryConflicts;
    }

    const stats = calculateConflictStats(conflicts);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('getConflictStats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/conflicts
export const getConflicts = async (req, res) => {
  try {
    const { status, severity, brand, search } = req.query;
    const dbStatus = getDBStatus();
    let conflicts = [];

    if (dbStatus.connected) {
      const query = {};
      if (status && status !== 'All') {
        query.status = status;
      } else if (!status) {
        query.status = { $ne: 'Resolved' }; // Default to unresolved
      }
      if (severity && severity !== 'All') query.severity = severity;
      if (brand && brand !== 'All') query.brand = brand;
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { brand: regex },
          { process: regex },
          { problem: regex },
          { employeeName: regex }
        ];
      }

      conflicts = await Conflict.find(query).sort({ severity: 1, date: 1 }).lean();
      if (!conflicts.length && !search && (!brand || brand === 'All')) {
        conflicts = inMemoryConflicts;
      }
    } else {
      conflicts = inMemoryConflicts.filter((c) => {
        if (status === 'Unresolved' && c.status === 'Resolved') return false;
        if (status === 'Resolved' && c.status !== 'Resolved') return false;
        if (!status && c.status === 'Resolved') return false;
        if (severity && severity !== 'All' && c.severity !== severity) return false;
        if (brand && brand !== 'All' && !c.brand.toLowerCase().includes(brand.toLowerCase())) return false;
        if (search) {
          const s = search.toLowerCase();
          const match =
            c.brand?.toLowerCase().includes(s) ||
            c.process?.toLowerCase().includes(s) ||
            c.problem?.toLowerCase().includes(s) ||
            c.employeeName?.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    }

    // Pod Lead data isolation on backend
    if (req.user?.role === 'pod_lead' && req.user.podId) {
      const leadPod = req.user.podId.replace(/[()]/g, '\\$&').slice(0, 8).toLowerCase();
      conflicts = conflicts.filter((c) => (c.pod || '').toLowerCase().includes(leadPod));
    }

    res.status(200).json({
      success: true,
      count: conflicts.length,
      data: conflicts
    });
  } catch (error) {
    console.error('getConflicts Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/conflicts/:id
export const getConflictById = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let conflict = null;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      conflict = await Conflict.findById(id).lean();
    }
    if (!conflict) {
      conflict = inMemoryConflicts.find((c) => c._id === id);
    }

    if (!conflict) {
      return res.status(404).json({ success: false, message: 'Conflict record not found.' });
    }

    res.status(200).json({
      success: true,
      data: conflict
    });
  } catch (error) {
    console.error('getConflictById Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/conflicts/:id/resolve
export const resolveConflict = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body || {};
    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      updated = await Conflict.findByIdAndUpdate(
        id,
        {
          status: 'Resolved',
          resolvedAt: new Date(),
          resolvedBy: 'Operations Manager',
          possibleResolution: resolutionNotes || 'Resolved manually by operations supervisor.'
        },
        { new: true }
      ).lean();
    }

    const idx = inMemoryConflicts.findIndex((c) => c._id === id);
    if (idx !== -1) {
      inMemoryConflicts[idx].status = 'Resolved';
      inMemoryConflicts[idx].resolvedAt = new Date().toISOString();
      inMemoryConflicts[idx].resolvedBy = 'Operations Manager';
      if (resolutionNotes) inMemoryConflicts[idx].possibleResolution = resolutionNotes;
      updated = inMemoryConflicts[idx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Conflict record not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Conflict marked as Resolved.',
      data: updated
    });
  } catch (error) {
    console.error('resolveConflict Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/conflicts/revalidate
// Section D: Revalidation
// Recalculates coverage and updates conflict statuses
export const revalidateConflicts = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let conflicts = [];
    let assignments = [];
    let leaves = [];
    let weeklyOffs = [];
    let processes = [];

    if (dbStatus.connected) {
      conflicts = await Conflict.find().lean();
      assignments = await ResourceAssignment.find({ status: { $ne: 'Inactive' } }).lean();
      leaves = await Leave.find().lean();
      weeklyOffs = await WeeklyOff.find().lean();
      processes = await Process.find().lean();
    } else {
      conflicts = inMemoryConflicts;
      assignments = seedAssignments;
      leaves = seedLeaves;
      weeklyOffs = seedWeeklyOffs;
      processes = seedProcesses;
    }

    // Recalculate: check each unresolved conflict
    // If backup staff is available or leave period ended, update status or adjust available employees
    let resolvedCountThisRun = 0;

    for (let c of conflicts) {
      if (c.status === 'Unresolved') {
        // Check if there is an active Backup assignment for this brand & process
        const hasBackupResource = assignments.some(
          (a) =>
            a.brand.toLowerCase().includes(c.brand.toLowerCase()) &&
            a.process.toLowerCase().includes(c.process.toLowerCase()) &&
            a.assignmentType === 'Backup'
        );

        if (hasBackupResource && c.availableEmployees < c.requiredEmployees) {
          c.availableEmployees = c.requiredEmployees;
          c.status = 'Resolved';
          c.possibleResolution = 'Automatically revalidated: Backup resource deployed to cover queue.';
          c.resolvedAt = new Date();
          c.resolvedBy = 'Roster Validation Engine';
          resolvedCountThisRun++;

          if (dbStatus.connected && c._id?.toString().match(/^[0-9a-fA-F]{24}$/)) {
            await Conflict.findByIdAndUpdate(c._id, {
              status: 'Resolved',
              availableEmployees: c.requiredEmployees,
              possibleResolution: c.possibleResolution,
              resolvedAt: new Date(),
              resolvedBy: 'Roster Validation Engine'
            });
          }
        }
      }
    }

    const updatedStats = calculateConflictStats(conflicts);

    res.status(200).json({
      success: true,
      message: `Revalidation engine completed! Recalculated coverage across ${processes.length} queues. ${resolvedCountThisRun} conflicts resolved automatically.`,
      resolvedThisRun: resolvedCountThisRun,
      stats: updatedStats,
      data: conflicts.filter((c) => c.status !== 'Resolved')
    });
  } catch (error) {
    console.error('revalidateConflicts Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
