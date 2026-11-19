import ResourceAssignment from '../models/ResourceAssignment.js';
import Employee from '../models/Employee.js';
import Brand from '../models/Brand.js';
import Process from '../models/Process.js';
import { getDBStatus } from '../config/db.js';
import {
  seedAssignments,
  seedEmployees,
  seedBrands,
  seedProcesses
} from '../data/seedData.js';

// In-memory fallback state for resilience mode
let inMemoryAssignments = seedAssignments.map((a, idx) => ({
  ...a,
  _id: `mem-assign-${idx + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// Helper to compute assignment overview metrics
const calculateOverview = (assignments, employees) => {
  const activeEmployees = employees.filter((e) => e.status !== 'Inactive');
  const activeAssignments = assignments.filter((a) => a.status !== 'Inactive');

  // Map employeeId -> Set of unique brands assigned
  const empBrandMap = new Map();
  // Map employeeId -> Boolean has backup assignment
  const empBackupMap = new Map();
  // Set of employeeIds that have at least one assignment
  const assignedEmpIds = new Set();

  for (const a of activeAssignments) {
    assignedEmpIds.add(a.employeeId);

    if (!empBrandMap.has(a.employeeId)) {
      empBrandMap.set(a.employeeId, new Set());
    }
    empBrandMap.get(a.employeeId).add(a.brand);

    if (a.assignmentType === 'Backup') {
      empBackupMap.set(a.employeeId, true);
    }
  }

  let dedicatedEmployees = 0;
  let multiBrandEmployees = 0;
  let backupEmployees = 0;
  let unassignedEmployees = 0;

  for (const emp of activeEmployees) {
    const brandsSet = empBrandMap.get(emp.employeeId);
    if (!brandsSet || brandsSet.size === 0) {
      unassignedEmployees++;
    } else if (brandsSet.size === 1) {
      dedicatedEmployees++;
    } else if (brandsSet.size > 1) {
      multiBrandEmployees++;
    }

    if (empBackupMap.get(emp.employeeId)) {
      backupEmployees++;
    }
  }

  return {
    totalAssignments: activeAssignments.length,
    dedicatedEmployees,
    multiBrandEmployees,
    backupEmployees,
    unassignedEmployees,
    totalActiveEmployees: activeEmployees.length
  };
};

// GET /api/assignments/overview
export const getAssignmentOverview = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let assignments = [];
    let employees = [];

    if (dbStatus.connected) {
      assignments = await ResourceAssignment.find({ status: { $ne: 'Inactive' } }).lean();
      employees = await Employee.find({ status: { $ne: 'Inactive' } }).lean();

      if (!assignments.length) {
        assignments = inMemoryAssignments;
      }
      if (!employees.length) {
        employees = seedEmployees;
      }
    } else {
      assignments = inMemoryAssignments;
      employees = seedEmployees;
    }

    const overview = calculateOverview(assignments, employees);

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('getAssignmentOverview Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/assignments
export const getAssignments = async (req, res) => {
  try {
    const { brand, process: proc, assignmentType, search } = req.query;
    const dbStatus = getDBStatus();
    let assignments = [];

    if (dbStatus.connected) {
      const query = { status: { $ne: 'Inactive' } };
      if (brand && brand !== 'All') query.brand = brand;
      if (proc && proc !== 'All') query.process = proc;
      if (assignmentType && assignmentType !== 'All') query.assignmentType = assignmentType;

      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { employeeName: regex },
          { employeeId: regex },
          { brand: regex },
          { process: regex }
        ];
      }

      assignments = await ResourceAssignment.find(query).sort({ createdAt: -1 }).lean();

      if (!assignments.length && !search && (!brand || brand === 'All')) {
        assignments = inMemoryAssignments;
      }
    } else {
      assignments = inMemoryAssignments.filter((a) => {
        if (a.status === 'Inactive') return false;
        if (brand && brand !== 'All' && a.brand !== brand) return false;
        if (proc && proc !== 'All' && a.process !== proc) return false;
        if (assignmentType && assignmentType !== 'All' && a.assignmentType !== assignmentType) return false;
        if (search) {
          const s = search.toLowerCase();
          const match =
            a.employeeName.toLowerCase().includes(s) ||
            a.employeeId.toLowerCase().includes(s) ||
            a.brand.toLowerCase().includes(s) ||
            a.process.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('getAssignments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/assignments
// Section D: Validations
// 1. Employee is active.
// 2. Brand exists.
// 3. Process belongs to the selected brand.
// 4. Duplicate assignment does not exist.
export const createAssignment = async (req, res) => {
  try {
    const { employeeId, brand, process: procName, assignmentType = 'Primary', notes = '' } = req.body;

    if (!employeeId || !brand || !procName) {
      return res.status(400).json({
        success: false,
        message: 'Employee, Brand, and Process are all required fields.'
      });
    }

    const dbStatus = getDBStatus();

    // 1. Check if Employee is active
    let employee = null;
    if (dbStatus.connected) {
      employee = await Employee.findOne({ employeeId }).lean();
    }
    if (!employee) {
      employee = seedEmployees.find((e) => e.employeeId === employeeId);
    }

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Employee with ID "${employeeId}" does not exist.`
      });
    }

    if (employee.status === 'Inactive') {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Cannot allocate inactive employee "${employee.name}". Only active employees can be assigned.`
      });
    }

    // 2. Check if Brand exists
    let brandDoc = null;
    if (dbStatus.connected) {
      brandDoc = await Brand.findOne({
        name: { $regex: new RegExp(`^${brand.trim()}$`, 'i') }
      }).lean();
    }
    if (!brandDoc) {
      brandDoc = seedBrands.find(
        (b) => b.name.toLowerCase() === brand.trim().toLowerCase()
      );
    }

    if (!brandDoc) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Brand "${brand}" does not exist in the system.`
      });
    }

    // 3. Check if Process belongs to the selected brand
    let processDoc = null;
    if (dbStatus.connected) {
      processDoc = await Process.findOne({
        brand: brandDoc.name,
        name: { $regex: new RegExp(`^${procName.trim()}$`, 'i') }
      }).lean();
    }
    if (!processDoc) {
      processDoc = seedProcesses.find(
        (p) =>
          p.brand.toLowerCase() === brandDoc.name.toLowerCase() &&
          p.name.toLowerCase() === procName.trim().toLowerCase()
      );
    }

    if (!processDoc) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Process "${procName}" does not belong to brand "${brandDoc.name}".`
      });
    }

    // 4. Check if duplicate assignment exists
    let existingAssignment = null;
    if (dbStatus.connected) {
      existingAssignment = await ResourceAssignment.findOne({
        employeeId: employee.employeeId,
        brand: brandDoc.name,
        process: processDoc.name,
        status: { $ne: 'Inactive' }
      }).lean();
    }
    if (!existingAssignment) {
      existingAssignment = inMemoryAssignments.find(
        (a) =>
          a.employeeId === employee.employeeId &&
          a.brand.toLowerCase() === brandDoc.name.toLowerCase() &&
          a.process.toLowerCase() === processDoc.name.toLowerCase() &&
          a.status !== 'Inactive'
      );
    }

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: `Validation Error: Duplicate assignment! "${employee.name}" is already assigned to "${processDoc.name}" for "${brandDoc.name}".`
      });
    }

    // Multi-brand advisory notification check
    // If employee is already assigned to a different brand, include advisory notice
    const otherBrandAssignments = inMemoryAssignments.filter(
      (a) => a.employeeId === employee.employeeId && a.brand !== brandDoc.name && a.status !== 'Inactive'
    );
    const multiBrandNotice =
      otherBrandAssignments.length > 0
        ? `Employee ${employee.name} is now cross-allocated across multiple brands (${[
            brandDoc.name,
            ...otherBrandAssignments.map((a) => a.brand)
          ]
            .filter((v, i, self) => self.indexOf(v) === i)
            .join(', ')}). Roster engine will ensure shift overlap prevention.`
        : null;

    const assignmentData = {
      employeeId: employee.employeeId,
      employeeName: employee.name,
      brand: brandDoc.name,
      process: processDoc.name,
      assignmentType: assignmentType === 'Backup' ? 'Backup' : 'Primary',
      pod: employee.pod || brandDoc.pod || 'General Operations',
      status: 'Active',
      assignedAt: new Date(),
      notes: notes || ''
    };

    let savedAssignment = null;
    if (dbStatus.connected) {
      savedAssignment = await ResourceAssignment.create(assignmentData);
    } else {
      savedAssignment = {
        ...assignmentData,
        _id: `mem-assign-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryAssignments.unshift(savedAssignment);
    }

    res.status(201).json({
      success: true,
      message: 'Resource assignment created successfully!',
      data: savedAssignment,
      multiBrandNotice
    });
  } catch (error) {
    console.error('createAssignment Error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Validation Error: A resource assignment with this employee, brand, and process already exists.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/assignments/:id
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignmentType, notes, status } = req.body;
    const dbStatus = getDBStatus();

    let updated = null;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const updateFields = {};
      if (assignmentType) updateFields.assignmentType = assignmentType;
      if (notes !== undefined) updateFields.notes = notes;
      if (status) updateFields.status = status;

      updated = await ResourceAssignment.findByIdAndUpdate(id, updateFields, { new: true }).lean();
    }

    if (!updated) {
      const idx = inMemoryAssignments.findIndex((a) => a._id === id);
      if (idx !== -1) {
        if (assignmentType) inMemoryAssignments[idx].assignmentType = assignmentType;
        if (notes !== undefined) inMemoryAssignments[idx].notes = notes;
        if (status) inMemoryAssignments[idx].status = status;
        inMemoryAssignments[idx].updatedAt = new Date().toISOString();
        updated = inMemoryAssignments[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Resource assignment not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateAssignment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/assignments/:id
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let removed = false;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const result = await ResourceAssignment.findByIdAndDelete(id);
      if (result) removed = true;
    }

    const idx = inMemoryAssignments.findIndex((a) => a._id === id);
    if (idx !== -1) {
      inMemoryAssignments.splice(idx, 1);
      removed = true;
    }

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Resource assignment not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Resource assignment deleted successfully.'
    });
  } catch (error) {
    console.error('deleteAssignment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
