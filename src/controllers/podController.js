import Pod from '../models/Pod.js';
import Employee from '../models/Employee.js';
import Brand from '../models/Brand.js';
import Process from '../models/Process.js';
import Conflict from '../models/Conflict.js';
import Leave from '../models/Leave.js';
import WeeklyOff from '../models/WeeklyOff.js';
import RosterAssignment from '../models/RosterAssignment.js';
import { getDBStatus } from '../config/db.js';
import {
  seedPods,
  seedEmployees,
  seedBrands,
  seedProcesses,
  seedConflicts,
  seedLeaves,
  seedWeeklyOffs
} from '../data/seedData.js';

// In-memory fallback state for resilience mode
let inMemoryPods = seedPods.map((p, idx) => ({
  ...p,
  _id: `mem-pod-${idx + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// Helper to calculate coverage status string from coverage rate
const getCoverageStatus = (rate) => {
  if (rate >= 90) return 'Optimal';
  if (rate >= 80) return 'Warning';
  return 'Critical';
};

// Helper to enrich a pod with live data from employees, brands, processes, and conflicts
const enrichPod = (pod, allEmployees = [], allProcesses = [], allConflicts = []) => {
  const podEmployees = allEmployees.filter(
    (e) => (e.pod || '').trim().toLowerCase() === pod.name.trim().toLowerCase()
  );

  const podLeadEmployee = allEmployees.find(
    (e) =>
      e.name?.toLowerCase() === pod.lead?.toLowerCase() ||
      (pod.leadId && e.employeeId === pod.leadId)
  );

  const podProcesses = allProcesses.filter(
    (p) => (p.pod || '').trim().toLowerCase() === pod.name.trim().toLowerCase()
  );

  // Collect distinct assigned brands from pod's explicit brands, process brands, and employee brands
  const brandsSet = new Set(pod.brands || []);
  if (pod.brand && pod.brand !== 'General Operations') brandsSet.add(pod.brand);
  podProcesses.forEach((p) => {
    if (p.brand) brandsSet.add(p.brand);
  });
  podEmployees.forEach((e) => {
    if (e.brand) brandsSet.add(e.brand);
  });
  const assignedBrands = Array.from(brandsSet);

  // Conflicts related to this pod
  const podConflicts = allConflicts.filter(
    (c) =>
      (c.pod || '').trim().toLowerCase() === pod.name.trim().toLowerCase() ||
      podEmployees.some((e) => e.employeeId === c.employeeId || e.name === c.employeeName)
  );
  const openConflicts = podConflicts.filter((c) => c.status !== 'Resolved');

  const coverageRate = pod.coverageRate ?? (podEmployees.length >= (pod.requiredStaff || 6) ? 95 : 82);
  const coverageStatus = pod.coverageStatus || getCoverageStatus(coverageRate);

  return {
    ...pod,
    _id: pod._id || `mem-pod-${pod.name.replace(/[^a-zA-Z0-9]/g, '')}`,
    lead: podLeadEmployee ? podLeadEmployee.name : pod.lead || 'Unassigned',
    leadId: podLeadEmployee ? podLeadEmployee.employeeId : pod.leadId || '',
    leadInfo: podLeadEmployee
      ? {
          name: podLeadEmployee.name,
          employeeId: podLeadEmployee.employeeId,
          email: podLeadEmployee.email,
          phone: podLeadEmployee.phone,
          designation: podLeadEmployee.designation,
          shift: podLeadEmployee.shift,
          avatar: podLeadEmployee.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        }
      : null,
    employeeCount: podEmployees.length,
    employees: podEmployees,
    assignedBrands: assignedBrands.length > 0 ? assignedBrands : [pod.brand || 'Enterprise Desk'],
    assignedProcesses: podProcesses,
    coverageRate,
    coverageStatus,
    openConflictsCount: openConflicts.length,
    conflicts: openConflicts
  };
};

// Generate calendar days for monthly roster display
const generateMonthDays = (year = 2026, month = 10) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    days.push({
      dayOfMonth: d,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayOfWeek: dayNames[dateObj.getDay()]
    });
  }
  return days;
};

// GET /api/pods
export const getPods = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let pods = [];
    let employees = [];
    let processes = [];
    let conflicts = [];

    if (dbStatus.connected) {
      pods = await Pod.find().lean();
      employees = await Employee.find({ status: { $ne: 'Inactive' } }).lean();
      processes = await Process.find().lean();
      conflicts = await Conflict.find().lean();

      if (!pods.length) {
        pods = inMemoryPods;
      }
      if (!employees.length) {
        employees = seedEmployees;
      }
      if (!processes.length) {
        processes = seedProcesses;
      }
      if (!conflicts.length) {
        conflicts = seedConflicts;
      }
    } else {
      pods = inMemoryPods;
      employees = seedEmployees;
      processes = seedProcesses;
      conflicts = seedConflicts;
    }

    let enriched = pods.map((p) => enrichPod(p, employees, processes, conflicts));

    // Pod Lead data isolation
    if (req.user?.role === 'pod_lead' && req.user.podId) {
      const leadPod = req.user.podId.toLowerCase();
      enriched = enriched.filter(
        (p) => p.name.toLowerCase().includes(leadPod) || leadPod.includes(p.name.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('getPods Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/pods/:id
export const getPodById = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let pod = null;
    let employees = [];
    let processes = [];
    let conflicts = [];
    let leaves = [];
    let weeklyOffs = [];
    let rosterAssignments = [];

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        pod = await Pod.findById(id).lean();
      } else {
        pod = await Pod.findOne({ name: decodeURIComponent(id) }).lean();
      }

      employees = await Employee.find().lean();
      processes = await Process.find().lean();
      conflicts = await Conflict.find().lean();
      leaves = await Leave.find().lean();
      weeklyOffs = await WeeklyOff.find().lean();
      rosterAssignments = await RosterAssignment.find().lean();
    }

    if (!pod) {
      pod = inMemoryPods.find(
        (p) => p._id === id || p.name.toLowerCase() === decodeURIComponent(id).toLowerCase()
      );
      employees = seedEmployees;
      processes = seedProcesses;
      conflicts = seedConflicts;
      leaves = seedLeaves;
      weeklyOffs = seedWeeklyOffs;
    }

    if (!pod) {
      return res.status(404).json({ success: false, message: 'Pod not found' });
    }

    // Pod Lead authorization restriction
    if (req.user?.role === 'pod_lead' && req.user.podId) {
      const leadPod = req.user.podId.toLowerCase();
      const targetPod = pod.name.toLowerCase();
      if (!targetPod.includes(leadPod) && !leadPod.includes(targetPod)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Pod Leads cannot access employee telemetry or rosters for other operational pods.'
        });
      }
    }

    const enriched = enrichPod(pod, employees, processes, conflicts);

    // Section C details:
    // 1. Pod lead information
    const podLeadEmployee = employees.find(
      (e) =>
        e.name?.toLowerCase() === pod.lead?.toLowerCase() ||
        (pod.leadId && e.employeeId === pod.leadId)
    );

    // 2. Employee list for this pod
    const podEmployees = employees.filter(
      (e) => (e.pod || '').trim().toLowerCase() === pod.name.trim().toLowerCase()
    );

    // 3. Assigned brands with details
    const assignedBrandDetails = [];
    for (const bName of enriched.assignedBrands) {
      const brandProcesses = processes.filter((p) => p.brand === bName);
      assignedBrandDetails.push({
        brandName: bName,
        processes: brandProcesses.map((p) => ({
          name: p.name,
          minimumStaff: p.minimumStaff ?? 1,
          operatingRule: p.operatingRule || 'Standard',
          workingDays: p.workingDays || []
        }))
      });
    }

    // 4. Pod-wise monthly roster calendar matrix
    const monthDays = generateMonthDays(2026, 10); // November 2026
    const rosterMatrix = podEmployees.map((emp) => {
      const schedule = {};
      monthDays.forEach((day) => {
        const matchingAssignment = rosterAssignments.find(
          (ra) => ra.employeeId === emp.employeeId && ra.date === day.dateString
        );

        if (matchingAssignment) {
          schedule[day.dateString] = {
            status: matchingAssignment.status,
            shift: matchingAssignment.shift,
            process: matchingAssignment.process
          };
        } else {
          // Fallback simulation based on employee's weekly off and leaves
          const isWeeklyOff = (emp.weeklyOffDays || ['Saturday', 'Sunday']).includes(
            day.dayOfWeek === 'Sun' ? 'Sunday' : day.dayOfWeek === 'Sat' ? 'Saturday' : ''
          );
          const hasLeave = leaves.some(
            (l) =>
              l.employeeId === emp.employeeId &&
              day.dateString >= l.startDate &&
              day.dateString <= l.endDate &&
              l.status === 'Approved'
          );
          const hasConflict = conflicts.some(
            (c) =>
              c.employeeId === emp.employeeId &&
              c.date === day.dateString &&
              c.status !== 'Resolved'
          );

          let status = 'Working';
          if (hasConflict) status = 'Conflict';
          else if (hasLeave) status = 'Leave';
          else if (isWeeklyOff) status = 'Weekly Off';

          schedule[day.dateString] = {
            status,
            shift: emp.shift || 'Day (08:00 - 17:00)',
            process: emp.process || 'Core Operations'
          };
        }
      });

      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        designation: emp.designation,
        shift: emp.shift,
        schedule
      };
    });

    // 5. Employee availability
    const podLeaves = leaves.filter((l) =>
      podEmployees.some((e) => e.employeeId === l.employeeId || e.name === l.employeeName)
    );
    const podWeeklyOffs = weeklyOffs.filter((w) =>
      podEmployees.some((e) => e.employeeId === w.employeeId || e.name === w.employeeName)
    );

    const onLeaveEmployees = podEmployees.filter((e) => e.status === 'On Leave');
    const availableEmployees = podEmployees.filter((e) => e.status === 'Active');

    const availability = {
      totalStaff: podEmployees.length,
      availableStaff: availableEmployees.length,
      onLeaveStaff: onLeaveEmployees.length,
      leaves: podLeaves,
      weeklyOffs: podWeeklyOffs,
      availabilityRate: podEmployees.length > 0
        ? Math.round((availableEmployees.length / podEmployees.length) * 100)
        : 100
    };

    // 6. Coverage conflicts
    const podConflicts = conflicts.filter(
      (c) =>
        (c.pod || '').trim().toLowerCase() === pod.name.trim().toLowerCase() ||
        podEmployees.some((e) => e.employeeId === c.employeeId || e.name === c.employeeName)
    );

    res.status(200).json({
      success: true,
      data: {
        ...enriched,
        podLeadInformation: podLeadEmployee || {
          name: pod.lead || 'Unassigned',
          employeeId: pod.leadId || 'N/A',
          designation: 'Operations Pod Lead',
          email: 'lead@operations.io',
          phone: '+1 555-0100',
          shift: pod.shiftTiming || 'Day (08:00 - 17:00)'
        },
        employeeList: podEmployees,
        assignedBrandDetails,
        monthlyRoster: {
          month: 'November 2026',
          year: 2026,
          days: monthDays,
          matrix: rosterMatrix
        },
        availability,
        coverageConflicts: podConflicts
      }
    });
  } catch (error) {
    console.error('getPodById Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/pods
// Section B: Add Pod
// Fields: Pod name, Pod lead, Employees, Description
export const createPod = async (req, res) => {
  try {
    const {
      name,
      lead,
      leadId,
      employees = [],
      assignedBrands = [],
      shiftTiming = 'Day (08:00 - 17:00)',
      description = '',
      requiredStaff = 8
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Pod name is required.' });
    }

    if (!lead || !lead.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pod lead is required. Please select a lead from the employee database.'
      });
    }

    const dbStatus = getDBStatus();

    // Check duplicate name
    let existingPod = null;
    if (dbStatus.connected) {
      existingPod = await Pod.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      }).lean();
    } else {
      existingPod = inMemoryPods.find(
        (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
    }

    if (existingPod) {
      return res.status(409).json({
        success: false,
        message: `Pod with name "${name}" already exists.`
      });
    }

    // Verify Pod Lead from employee database
    let leadEmp = null;
    if (dbStatus.connected) {
      if (leadId) leadEmp = await Employee.findOne({ employeeId: leadId }).lean();
      if (!leadEmp) leadEmp = await Employee.findOne({ name: lead }).lean();
    }
    if (!leadEmp) {
      leadEmp = seedEmployees.find((e) => e.employeeId === leadId || e.name === lead);
    }

    const leadName = leadEmp ? leadEmp.name : lead;
    const finalLeadId = leadEmp ? leadEmp.employeeId : leadId || '';

    const newPodData = {
      name: name.trim(),
      lead: leadName,
      leadId: finalLeadId,
      description: description.trim(),
      brand: assignedBrands[0] || 'General Operations',
      brands: assignedBrands.length > 0 ? assignedBrands : ['General Operations'],
      shiftTiming,
      status: 'Active',
      requiredStaff: Number(requiredStaff) || Math.max(employees.length, 6),
      currentStaff: employees.length,
      coverageRate: 94,
      coverageStatus: 'Optimal'
    };

    let savedPod = null;
    if (dbStatus.connected) {
      savedPod = await Pod.create(newPodData);

      // Update selected employees to assign them to this new pod
      if (employees.length > 0) {
        await Employee.updateMany(
          { employeeId: { $in: employees } },
          { $set: { pod: savedPod.name } }
        );
      }
      // Update lead employee's pod
      if (finalLeadId) {
        await Employee.updateOne(
          { employeeId: finalLeadId },
          { $set: { pod: savedPod.name } }
        );
      }
    } else {
      savedPod = {
        ...newPodData,
        _id: `mem-pod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryPods.unshift(savedPod);

      // Update in-memory employees
      employees.forEach((empId) => {
        const emp = seedEmployees.find((e) => e.employeeId === empId);
        if (emp) emp.pod = savedPod.name;
      });
      if (finalLeadId) {
        const lead = seedEmployees.find((e) => e.employeeId === finalLeadId);
        if (lead) lead.pod = savedPod.name;
      }
    }

    res.status(201).json({
      success: true,
      message: `Operational Pod "${savedPod.name}" created successfully!`,
      data: savedPod
    });
  } catch (error) {
    console.error('createPod Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/pods/:id
export const updatePod = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      lead,
      leadId,
      description,
      brands,
      shiftTiming,
      status,
      requiredStaff,
      employees
    } = req.body;

    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (lead) updateData.lead = lead.trim();
      if (leadId) updateData.leadId = leadId;
      if (description !== undefined) updateData.description = description.trim();
      if (brands) updateData.brands = brands;
      if (shiftTiming) updateData.shiftTiming = shiftTiming;
      if (status) updateData.status = status;
      if (requiredStaff) updateData.requiredStaff = Number(requiredStaff);

      updated = await Pod.findByIdAndUpdate(id, updateData, { new: true }).lean();

      // If employee list provided, update their pod assignment
      if (employees && Array.isArray(employees) && updated) {
        await Employee.updateMany(
          { employeeId: { $in: employees } },
          { $set: { pod: updated.name } }
        );
      }
    }

    if (!updated) {
      const idx = inMemoryPods.findIndex((p) => p._id === id || p.name === id);
      if (idx !== -1) {
        if (name) inMemoryPods[idx].name = name.trim();
        if (lead) inMemoryPods[idx].lead = lead.trim();
        if (leadId) inMemoryPods[idx].leadId = leadId;
        if (description !== undefined) inMemoryPods[idx].description = description.trim();
        if (brands) inMemoryPods[idx].brands = brands;
        if (shiftTiming) inMemoryPods[idx].shiftTiming = shiftTiming;
        if (status) inMemoryPods[idx].status = status;
        if (requiredStaff) inMemoryPods[idx].requiredStaff = Number(requiredStaff);
        inMemoryPods[idx].updatedAt = new Date().toISOString();
        updated = inMemoryPods[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pod not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Pod updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updatePod Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/pods/:id
export const deletePod = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let deleted = false;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const result = await Pod.findByIdAndDelete(id);
      if (result) deleted = true;
    }

    const idx = inMemoryPods.findIndex((p) => p._id === id || p.name === id);
    if (idx !== -1) {
      inMemoryPods.splice(idx, 1);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pod not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Operational Pod deleted successfully'
    });
  } catch (error) {
    console.error('deletePod Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
