import Employee from '../models/Employee.js';
import Brand from '../models/Brand.js';
import Pod from '../models/Pod.js';
import Process from '../models/Process.js';
import Roster from '../models/Roster.js';
import Leave from '../models/Leave.js';
import Holiday from '../models/Holiday.js';
import RosterAssignment from '../models/RosterAssignment.js';
import { getDBStatus } from '../config/db.js';
import {
  generateMonthlyRoster,
  validateRoster,
  calculateCoverageSummary,
  brandProcessCalendars
} from '../services/rosterEngine.js';
import {
  seedEmployees,
  seedLeaves,
  seedHolidays,
  seedBrands,
  seedPods,
  seedProcesses
} from '../data/seedData.js';

// In-memory working cache
let inMemoryAssignments = [];
let inMemoryRosterState = {
  month: 'November 2026',
  monthIndex: 10,
  year: 2026,
  status: 'Published',
  completionRate: 88.5,
  totalRequiredShifts: 1200,
  assignedShifts: 1062
};

// Initialize default assignments in memory on startup
const initializeDefaultRoster = () => {
  if (inMemoryAssignments.length === 0) {
    inMemoryAssignments = generateMonthlyRoster({
      monthName: 'November 2026',
      year: 2026,
      employees: seedEmployees,
      leaves: seedLeaves,
      holidays: seedHolidays
    });
  }
};
initializeDefaultRoster();

// Helper to get dates for a month
const getMonthDates = (year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, monthIndex, d);
    dates.push({
      date: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayOfMonth: d,
      dayOfWeek: shortDayNames[dObj.getDay()]
    });
  }
  return dates;
};

// GET /api/rosters
export const getRoster = async (req, res) => {
  try {
    const {
      month = 'November',
      year = 2026,
      pod,
      brand,
      process: procName,
      search,
      targetDate
    } = req.query;

    const monthName = month.includes('20') ? month : `${month} ${year}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const pureMonth = month.split(' ')[0];
    const monthIndex = monthNames.indexOf(pureMonth) !== -1 ? monthNames.indexOf(pureMonth) : 10;
    const yearNum = Number(year) || 2026;

    const dbStatus = getDBStatus();
    let assignments = [];
    let rosterMeta = inMemoryRosterState;
    let employeesList = [];
    let brandsList = [];
    let podsList = [];
    let processesList = [];

    if (dbStatus.connected) {
      rosterMeta = (await Roster.findOne({ month: monthName })) || inMemoryRosterState;
      assignments = await RosterAssignment.find({ month: monthName, year: yearNum });

      if (assignments.length === 0) {
        // Auto-seed in MongoDB if not yet generated
        employeesList = await Employee.find({ status: { $ne: 'Inactive' } });
        const leaves = await Leave.find();
        const holidays = await Holiday.find();

        assignments = generateMonthlyRoster({
          monthName,
          year: yearNum,
          employees: employeesList.length ? employeesList : seedEmployees,
          leaves,
          holidays
        });

        await RosterAssignment.insertMany(assignments);
      }

      employeesList = await Employee.find({ status: { $ne: 'Inactive' } });
      brandsList = await Brand.find({ status: 'Active' });
      podsList = await Pod.find({ status: 'Active' });
      processesList = await Process.find({ status: 'Active' });
    } else {
      assignments = inMemoryAssignments.filter(
        (a) => a.year === yearNum && (a.month === monthName || a.monthIndex === monthIndex)
      );

      if (assignments.length === 0) {
        assignments = generateMonthlyRoster({
          monthName,
          year: yearNum,
          employees: seedEmployees,
          leaves: seedLeaves,
          holidays: seedHolidays
        });
        inMemoryAssignments = [...inMemoryAssignments, ...assignments];
      }

      employeesList = seedEmployees;
      brandsList = seedBrands;
      podsList = seedPods;
      processesList = seedProcesses;
    }

    const monthDates = getMonthDates(yearNum, monthIndex);

    // Filter assignments
    let filteredAssignments = [...assignments];
    if (pod && pod !== 'All Pods') {
      filteredAssignments = filteredAssignments.filter((a) => a.pod === pod);
    }
    if (brand && brand !== 'All Brands') {
      filteredAssignments = filteredAssignments.filter((a) => a.brand === brand);
    }
    if (procName && procName !== 'All Processes') {
      filteredAssignments = filteredAssignments.filter((a) => a.process === procName);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filteredAssignments = filteredAssignments.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeId.toLowerCase().includes(q) ||
          a.pod.toLowerCase().includes(q)
      );
    }

    // Extract unique employees in the filtered assignments
    const employeeMap = {};
    filteredAssignments.forEach((a) => {
      if (!employeeMap[a.employeeId]) {
        employeeMap[a.employeeId] = {
          employeeId: a.employeeId,
          name: a.employeeName,
          brand: a.brand,
          pod: a.pod,
          process: a.process,
          shift: a.shift,
          assignmentsByDate: {},
          metrics: { working: 0, off: 0, leave: 0, holiday: 0, conflict: 0 }
        };
      }
      employeeMap[a.employeeId].assignmentsByDate[a.date] = {
        _id: a._id,
        date: a.date,
        dayOfMonth: a.dayOfMonth,
        dayOfWeek: a.dayOfWeek,
        status: a.status,
        shift: a.shift,
        leaveType: a.leaveType,
        holidayName: a.holidayName,
        conflictReason: a.conflictReason,
        notes: a.notes
      };

      if (a.status === 'Working') employeeMap[a.employeeId].metrics.working++;
      else if (a.status === 'Weekly Off') employeeMap[a.employeeId].metrics.off++;
      else if (a.status === 'Leave') employeeMap[a.employeeId].metrics.leave++;
      else if (a.status === 'Holiday') employeeMap[a.employeeId].metrics.holiday++;
      else if (a.status === 'Conflict') employeeMap[a.employeeId].metrics.conflict++;
    });

    const employeesWithRoster = Object.values(employeeMap);

    // Groupings for the 5 views
    // 1. Company-wise: flat sorted list
    // 2. Pod-wise: grouped by pod
    const podWise = {};
    employeesWithRoster.forEach((emp) => {
      if (!podWise[emp.pod]) podWise[emp.pod] = [];
      podWise[emp.pod].push(emp);
    });

    // 3. Brand-wise: grouped by brand
    const brandWise = {};
    employeesWithRoster.forEach((emp) => {
      if (!brandWise[emp.brand]) brandWise[emp.brand] = [];
      brandWise[emp.brand].push(emp);
    });

    // 4. Process-wise: grouped by process
    const processWise = {};
    employeesWithRoster.forEach((emp) => {
      if (!processWise[emp.process]) processWise[emp.process] = [];
      processWise[emp.process].push(emp);
    });

    // 5. Employee-wise: enriched cards
    const employeeWise = employeesWithRoster.map((emp) => ({
      ...emp,
      attendanceRate: +(
        (emp.metrics.working / (emp.metrics.working + emp.metrics.leave || 1)) *
        100
      ).toFixed(1)
    }));

    // Validation & Coverage
    const validation = validateRoster(filteredAssignments, processesList);
    const coverageSummary = calculateCoverageSummary(
      filteredAssignments,
      targetDate || '2026-11-19'
    );

    res.status(200).json({
      success: true,
      data: {
        roster: rosterMeta,
        monthName,
        year: yearNum,
        dates: monthDates,
        todayDate: '2026-11-19',
        employeesCount: employeesWithRoster.length,
        employees: employeesWithRoster,
        views: {
          companyWise: employeesWithRoster,
          podWise,
          brandWise,
          processWise,
          employeeWise
        },
        validation,
        coverageSummary,
        filtersAvailable: {
          brands: brandsList.map((b) => b.name),
          pods: podsList.map((p) => p.name),
          processes: processesList.map((p) => p.name)
        }
      }
    });
  } catch (error) {
    console.error('getRoster Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/rosters/generate
export const generateRoster = async (req, res) => {
  try {
    const { month = 'November', year = 2026 } = req.body;
    const monthName = month.includes('20') ? month : `${month} ${year}`;
    const yearNum = Number(year) || 2026;

    const dbStatus = getDBStatus();
    let employeesList = [];
    let leavesList = [];
    let holidaysList = [];

    if (dbStatus.connected) {
      employeesList = await Employee.find({ status: { $ne: 'Inactive' } });
      leavesList = await Leave.find();
      holidaysList = await Holiday.find();

      const newAssignments = generateMonthlyRoster({
        monthName,
        year: yearNum,
        employees: employeesList.length ? employeesList : seedEmployees,
        leaves: leavesList,
        holidays: holidaysList
      });

      // Clear old and insert new
      await RosterAssignment.deleteMany({ month: monthName, year: yearNum });
      await RosterAssignment.insertMany(newAssignments);

      const workingCount = newAssignments.filter((a) => a.status === 'Working').length;
      const totalCount = newAssignments.length;
      const completionRate = +((workingCount / (totalCount * 0.72)) * 100).toFixed(1);

      await Roster.findOneAndUpdate(
        { month: monthName },
        {
          assignedShifts: workingCount,
          totalRequiredShifts: Math.round(totalCount * 0.72),
          completionRate: Math.min(100, completionRate),
          status: 'Published',
          lastGeneratedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Roster for ${monthName} successfully generated respecting all brand-process calendars!`,
        totalAssignments: newAssignments.length
      });
    }

    // In-memory generation
    const newAssignments = generateMonthlyRoster({
      monthName,
      year: yearNum,
      employees: seedEmployees,
      leaves: seedLeaves,
      holidays: seedHolidays
    });

    inMemoryAssignments = [
      ...inMemoryAssignments.filter((a) => !(a.month === monthName && a.year === yearNum)),
      ...newAssignments
    ];

    const workingCount = newAssignments.filter((a) => a.status === 'Working').length;
    inMemoryRosterState = {
      month: monthName,
      monthIndex: 10,
      year: yearNum,
      status: 'Published',
      completionRate: 92.4,
      totalRequiredShifts: 1200,
      assignedShifts: workingCount
    };

    res.status(200).json({
      success: true,
      message: `Roster for ${monthName} generated respecting each brand-process operational schedule!`,
      totalAssignments: newAssignments.length
    });
  } catch (error) {
    console.error('generateRoster Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/rosters/validate
export const validateRosterAction = async (req, res) => {
  try {
    const { month = 'November 2026', year = 2026 } = req.body;
    const yearNum = Number(year) || 2026;

    const dbStatus = getDBStatus();
    let assignments = [];

    if (dbStatus.connected) {
      assignments = await RosterAssignment.find({ month, year: yearNum });
    }
    if (!assignments.length) {
      assignments = inMemoryAssignments.filter((a) => a.month === month || a.year === yearNum);
    }

    const validation = validateRoster(assignments);

    res.status(200).json({
      success: true,
      message: validation.isValid
        ? 'Roster validation passed with 0 conflicts!'
        : `Validation found ${validation.totalConflicts} conflicts and ${validation.totalGaps} staffing gaps.`,
      data: validation
    });
  } catch (error) {
    console.error('validateRosterAction Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/rosters/publish
export const publishRosterAction = async (req, res) => {
  try {
    const { month = 'November 2026', status = 'Published' } = req.body;

    const dbStatus = getDBStatus();
    if (dbStatus.connected) {
      await Roster.findOneAndUpdate({ month }, { status }, { upsert: true });
    }
    inMemoryRosterState.status = status;

    res.status(200).json({
      success: true,
      message: `Roster status updated to ${status}`,
      status
    });
  } catch (error) {
    console.error('publishRosterAction Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/rosters/entry (Manual Editing)
export const updateRosterEntry = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      brand,
      process: procName,
      status,
      shift,
      reasonForModification
    } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, date, and status are required fields.'
      });
    }

    const dbStatus = getDBStatus();
    let updatedDoc;

    if (dbStatus.connected) {
      updatedDoc = await RosterAssignment.findOneAndUpdate(
        { employeeId, date },
        {
          brand,
          process: procName,
          status,
          shift: status === 'Working' ? shift : 'Off',
          notes: reasonForModification || 'Manually updated by Operations Manager',
          conflictReason: status === 'Conflict' ? reasonForModification : null,
          modifiedBy: 'Operations Manager'
        },
        { new: true }
      );
    }

    // Update in-memory copy
    const memIndex = inMemoryAssignments.findIndex(
      (a) => a.employeeId === employeeId && a.date === date
    );
    if (memIndex !== -1) {
      inMemoryAssignments[memIndex] = {
        ...inMemoryAssignments[memIndex],
        brand: brand || inMemoryAssignments[memIndex].brand,
        process: procName || inMemoryAssignments[memIndex].process,
        status,
        shift: status === 'Working' ? shift : 'Off',
        notes: reasonForModification || 'Manually modified',
        conflictReason: status === 'Conflict' ? reasonForModification : null,
        modifiedBy: 'Operations Manager'
      };
      if (!updatedDoc) updatedDoc = inMemoryAssignments[memIndex];
    }

    // Automatically re-trigger roster validation
    const currentAssignments = dbStatus.connected
      ? await RosterAssignment.find({ date: { $regex: `^${date.substring(0, 7)}` } })
      : inMemoryAssignments;

    const validation = validateRoster(currentAssignments);
    const coverageSummary = calculateCoverageSummary(currentAssignments, date);

    res.status(200).json({
      success: true,
      message: `Roster cell for ${employeeId} on ${date} successfully updated to ${status}! Roster re-validated.`,
      data: updatedDoc,
      validation,
      coverageSummary
    });
  } catch (error) {
    console.error('updateRosterEntry Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/rosters/export-csv
export const exportRosterCSV = async (req, res) => {
  try {
    const { month = 'November 2026', year = 2026 } = req.query;
    const yearNum = Number(year) || 2026;
    const monthIndex = 10; // November

    const dbStatus = getDBStatus();
    let assignments = [];

    if (dbStatus.connected) {
      assignments = await RosterAssignment.find({ month, year: yearNum });
    }
    if (!assignments.length) {
      assignments = inMemoryAssignments.filter((a) => a.year === yearNum);
    }

    const monthDates = getMonthDates(yearNum, monthIndex);
    const dateHeaders = monthDates.map((d) => `"${d.dayOfMonth} ${month.split(' ')[0]} (${d.dayOfWeek})"`).join(',');
    const csvHeader = `"Employee ID","Employee Name","Brand","Pod","Process",${dateHeaders}\n`;

    const employeesMap = {};
    assignments.forEach((a) => {
      if (!employeesMap[a.employeeId]) {
        employeesMap[a.employeeId] = {
          id: a.employeeId,
          name: a.employeeName,
          brand: a.brand,
          pod: a.pod,
          process: a.process,
          dates: {}
        };
      }
      employeesMap[a.employeeId].dates[a.date] = a.status;
    });

    let csvBody = '';
    Object.values(employeesMap).forEach((emp) => {
      const rowDates = monthDates.map((d) => `"${emp.dates[d.date] || 'Off'}"`).join(',');
      csvBody += `"${emp.id}","${emp.name}","${emp.brand}","${emp.pod}","${emp.process}",${rowDates}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Roster_${month.replace(' ', '_')}.csv"`
    );
    res.status(200).send(csvHeader + csvBody);
  } catch (error) {
    console.error('exportRosterCSV Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/rosters/coverage-summary
export const getCoverageSummaryEndpoint = async (req, res) => {
  try {
    const { date = '2026-11-19' } = req.query;
    const dbStatus = getDBStatus();
    let assignments = [];

    if (dbStatus.connected) {
      assignments = await RosterAssignment.find({ date });
    }
    if (!assignments.length) {
      assignments = inMemoryAssignments.filter((a) => a.date === date);
    }

    const coverageSummary = calculateCoverageSummary(assignments, date);

    res.status(200).json({
      success: true,
      date,
      data: coverageSummary
    });
  } catch (error) {
    console.error('getCoverageSummaryEndpoint Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
