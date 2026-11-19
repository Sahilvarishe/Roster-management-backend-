import Leave from '../models/Leave.js';
import WeeklyOff from '../models/WeeklyOff.js';
import Holiday from '../models/Holiday.js';
import Employee from '../models/Employee.js';
import Process from '../models/Process.js';
import Brand from '../models/Brand.js';
import { getDBStatus } from '../config/db.js';
import {
  seedLeaves,
  seedWeeklyOffs,
  seedHolidays,
  seedEmployees,
  seedProcesses,
  seedBrands
} from '../data/seedData.js';

// In-memory fallback state for resilience mode
let inMemoryLeaves = seedLeaves.map((l, idx) => ({
  ...l,
  _id: `mem-leave-${idx + 1}`,
  dates: l.dates || [l.startDate],
  availabilityStatus: l.availabilityStatus || (l.status === 'Approved' ? 'Approved leave' : 'Planned leave'),
  createdAt: new Date().toISOString()
}));

let inMemoryWeeklyOffs = seedWeeklyOffs.map((w, idx) => ({
  ...w,
  _id: `mem-woff-${idx + 1}`,
  weeklyOffRule: w.weeklyOffRule || (w.scheduledOffDays ? w.scheduledOffDays[0] : 'Sunday'),
  createdAt: new Date().toISOString()
}));

let inMemoryHolidays = seedHolidays.map((h, idx) => ({
  ...h,
  _id: `mem-hol-${idx + 1}`,
  applicableRegionOrGroup: h.applicableRegionOrGroup || 'All Regions',
  createdAt: new Date().toISOString()
}));

// Helper to calculate days of a month
const getMonthDays = (year = 2026, month = 10) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// ==========================================
// A. EMPLOYEE AVAILABILITY CONTROLLERS
// ==========================================

// GET /api/availability/calendar?employeeId=EMP001&month=11&year=2026
export const getAvailabilityCalendar = async (req, res) => {
  try {
    const { employeeId, month = 11, year = 2026 } = req.query;
    const dbStatus = getDBStatus();
    const m = parseInt(month) - 1;
    const y = parseInt(year);

    let employee = null;
    let leaves = [];
    let weeklyOff = null;
    let holidays = [];

    if (dbStatus.connected) {
      if (employeeId) employee = await Employee.findOne({ employeeId }).lean();
      leaves = await Leave.find().lean();
      if (employeeId) weeklyOff = await WeeklyOff.findOne({ employeeId }).lean();
      holidays = await Holiday.find().lean();
    }

    if (!employee && employeeId) {
      employee = seedEmployees.find((e) => e.employeeId === employeeId);
    }
    if (!employee) {
      employee = seedEmployees[0]; // Default to Rahul Sharma
    }

    if (!leaves.length) leaves = inMemoryLeaves;
    if (!weeklyOff && employee) {
      weeklyOff = inMemoryWeeklyOffs.find((w) => w.employeeId === employee.employeeId);
    }
    if (!holidays.length) holidays = inMemoryHolidays;

    const days = getMonthDays(y, m);
    const empWeeklyOffDays = weeklyOff?.scheduledOffDays || employee.weeklyOffDays || ['Sunday'];
    const weeklyOffRule = weeklyOff?.weeklyOffRule || employee.weeklyOffRule || 'Sunday';

    // Map each day to status
    const calendarDays = days.map((day) => {
      // 1. Check if public holiday
      const hol = holidays.find((h) => h.date === day.dateString);

      // 2. Check if weekly off
      let isWeeklyOff = false;
      if (weeklyOffRule === 'Rotational') {
        // Rotational schedule cycle
        isWeeklyOff = day.dayOfMonth % 6 === 0;
      } else {
        isWeeklyOff = empWeeklyOffDays.includes(day.dayOfWeek);
      }

      // 3. Check leave / unavailability records for this employee
      const matchingLeave = leaves.find((l) => {
        if (l.employeeId !== employee.employeeId) return false;
        if (l.dates && l.dates.includes(day.dateString)) return true;
        return day.dateString >= l.startDate && day.dateString <= l.endDate;
      });

      let status = 'Available';
      let details = 'Regular operational availability';

      if (matchingLeave) {
        status = matchingLeave.availabilityStatus || (matchingLeave.status === 'Approved' ? 'Approved leave' : 'Planned leave');
        details = matchingLeave.reason || matchingLeave.leaveType;
      } else if (isWeeklyOff) {
        status = 'Weekly Off';
        details = `Scheduled off day (${weeklyOffRule})`;
      } else if (hol) {
        status = 'Holiday';
        details = hol.name;
      }

      return {
        date: day.dateString,
        dayOfMonth: day.dayOfMonth,
        dayOfWeek: day.dayOfWeek,
        status,
        details,
        holidayName: hol ? hol.name : null,
        leaveId: matchingLeave ? matchingLeave._id : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        employee: {
          employeeId: employee.employeeId,
          name: employee.name,
          designation: employee.designation,
          pod: employee.pod,
          brand: employee.brand,
          weeklyOffRule
        },
        month: m + 1,
        year: y,
        calendarDays
      }
    });
  } catch (error) {
    console.error('getAvailabilityCalendar Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/availability/configure
// Allow managers to configure: Available, Planned leave, Approved leave, Comp-off, Other unavailability
export const configureAvailability = async (req, res) => {
  try {
    const {
      employeeId,
      dates = [],
      startDate,
      endDate,
      availabilityStatus = 'Approved leave',
      leaveType = 'Annual',
      reason = ''
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const targetDates = dates.length > 0 ? dates : startDate && endDate ? [startDate, endDate] : [startDate];
    if (!targetDates.length || !targetDates[0]) {
      return res.status(400).json({ success: false, message: 'Please select one or more dates.' });
    }

    const dbStatus = getDBStatus();
    let employee = null;

    if (dbStatus.connected) {
      employee = await Employee.findOne({ employeeId }).lean();
    }
    if (!employee) {
      employee = seedEmployees.find((e) => e.employeeId === employeeId);
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Sort dates
    targetDates.sort();
    const finalStartDate = targetDates[0];
    const finalEndDate = targetDates[targetDates.length - 1];

    if (availabilityStatus === 'Available') {
      // Removing leave/unavailability for these dates
      if (dbStatus.connected) {
        await Leave.deleteMany({
          employeeId: employee.employeeId,
          $or: [
            { dates: { $in: targetDates } },
            { startDate: { $in: targetDates } }
          ]
        });
      }
      inMemoryLeaves = inMemoryLeaves.filter(
        (l) => !(l.employeeId === employee.employeeId && targetDates.includes(l.startDate))
      );

      return res.status(200).json({
        success: true,
        message: `Marked ${employee.name} as Available on selected date(s).`
      });
    }

    const leaveData = {
      employeeId: employee.employeeId,
      employeeName: employee.name,
      role: employee.designation,
      brand: employee.brand || 'General Operations',
      pod: employee.pod || 'General Operations',
      availabilityStatus, // 'Planned leave', 'Approved leave', 'Comp-off', 'Other unavailability'
      leaveType: leaveType || (availabilityStatus === 'Comp-off' ? 'Compensatory' : 'Leave'),
      startDate: finalStartDate,
      endDate: finalEndDate,
      dates: targetDates,
      durationDays: targetDates.length,
      status: availabilityStatus === 'Approved leave' || availabilityStatus === 'Comp-off' ? 'Approved' : 'Pending',
      reason: reason || `${availabilityStatus} configured by manager`
    };

    let savedRecord = null;
    if (dbStatus.connected) {
      savedRecord = await Leave.create(leaveData);
    } else {
      savedRecord = {
        ...leaveData,
        _id: `mem-leave-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      inMemoryLeaves.unshift(savedRecord);
    }

    res.status(201).json({
      success: true,
      message: `Configured "${availabilityStatus}" for ${employee.name} (${targetDates.length} days).`,
      data: savedRecord
    });
  } catch (error) {
    console.error('configureAvailability Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/availability/records
export const getAvailabilityRecords = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let records = [];

    if (dbStatus.connected) {
      records = await Leave.find().sort({ startDate: -1 }).lean();
      if (!records.length) records = inMemoryLeaves;
    } else {
      records = inMemoryLeaves;
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('getAvailabilityRecords Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// B. WEEKLY OFF MANAGEMENT CONTROLLERS
// ==========================================

// GET /api/availability/weekly-offs
export const getWeeklyOffs = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let weeklyOffs = [];
    let employees = [];

    if (dbStatus.connected) {
      weeklyOffs = await WeeklyOff.find().lean();
      employees = await Employee.find({ status: { $ne: 'Inactive' } }).lean();

      if (!weeklyOffs.length) weeklyOffs = inMemoryWeeklyOffs;
      if (!employees.length) employees = seedEmployees;
    } else {
      weeklyOffs = inMemoryWeeklyOffs;
      employees = seedEmployees;
    }

    // Merge so every active employee has a weekly off rule entry
    const results = employees.map((emp) => {
      const match = weeklyOffs.find((w) => w.employeeId === emp.employeeId);
      const weeklyOffRule = match?.weeklyOffRule || emp.weeklyOffRule || (emp.weeklyOffDays ? emp.weeklyOffDays[0] : 'Sunday');
      const scheduledOffDays = match?.scheduledOffDays || emp.weeklyOffDays || [weeklyOffRule];

      return {
        _id: match?._id || `mem-woff-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        designation: emp.designation,
        brand: emp.brand || 'Brand Alpha',
        pod: emp.pod || 'Pod Alpha (Inbound Core)',
        weeklyOffRule, // e.g. Sunday, Wednesday, Friday, Rotational
        scheduledOffDays,
        shiftPattern: match?.shiftPattern || `${weeklyOffRule} Off Pattern`,
        upcomingOffDate: match?.upcomingOffDate || '2026-11-22'
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('getWeeklyOffs Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/availability/weekly-offs/:employeeId
// Update individual pattern: Rahul -> Sunday, Amit -> Wednesday, Priya -> Friday, Neha -> Rotational
export const updateWeeklyOff = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { weeklyOffRule, scheduledOffDays, shiftPattern, notes } = req.body;

    if (!weeklyOffRule) {
      return res.status(400).json({ success: false, message: 'Weekly off rule is required.' });
    }

    const finalOffDays = scheduledOffDays && scheduledOffDays.length > 0 ? scheduledOffDays : [weeklyOffRule];
    const dbStatus = getDBStatus();

    let updatedRecord = null;
    if (dbStatus.connected) {
      updatedRecord = await WeeklyOff.findOneAndUpdate(
        { employeeId },
        {
          weeklyOffRule,
          scheduledOffDays: finalOffDays,
          shiftPattern: shiftPattern || `${weeklyOffRule} Individual Off Pattern`,
          notes: notes || ''
        },
        { new: true, upsert: true }
      ).lean();

      // Also sync to Employee document
      await Employee.updateOne(
        { employeeId },
        {
          $set: {
            weeklyOffRule,
            weeklyOffDays: finalOffDays
          }
        }
      );
    }

    // In-memory update
    const idx = inMemoryWeeklyOffs.findIndex((w) => w.employeeId === employeeId);
    if (idx !== -1) {
      inMemoryWeeklyOffs[idx].weeklyOffRule = weeklyOffRule;
      inMemoryWeeklyOffs[idx].scheduledOffDays = finalOffDays;
      inMemoryWeeklyOffs[idx].shiftPattern = shiftPattern || `${weeklyOffRule} Individual Off Pattern`;
      updatedRecord = inMemoryWeeklyOffs[idx];
    } else {
      const emp = seedEmployees.find((e) => e.employeeId === employeeId);
      const newOff = {
        _id: `mem-woff-${Date.now()}`,
        employeeId,
        employeeName: emp ? emp.name : employeeId,
        brand: emp?.brand || 'Brand Alpha',
        pod: emp?.pod || 'Pod Alpha (Inbound Core)',
        weeklyOffRule,
        scheduledOffDays: finalOffDays,
        shiftPattern: shiftPattern || `${weeklyOffRule} Individual Off Pattern`,
        upcomingOffDate: '2026-11-22'
      };
      inMemoryWeeklyOffs.push(newOff);
      updatedRecord = newOff;
    }

    // Also update seedEmployees in-memory
    const empIdx = seedEmployees.findIndex((e) => e.employeeId === employeeId);
    if (empIdx !== -1) {
      seedEmployees[empIdx].weeklyOffRule = weeklyOffRule;
      seedEmployees[empIdx].weeklyOffDays = finalOffDays;
    }

    res.status(200).json({
      success: true,
      message: `Updated weekly off rule for ${updatedRecord.employeeName || employeeId} to "${weeklyOffRule}".`,
      data: updatedRecord
    });
  } catch (error) {
    console.error('updateWeeklyOff Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// C. PUBLIC HOLIDAYS & PROCESS IMPACT CONTROLLERS
// ==========================================

// GET /api/availability/holidays
export const getHolidays = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let holidays = [];
    let processes = [];

    if (dbStatus.connected) {
      holidays = await Holiday.find().sort({ date: 1 }).lean();
      processes = await Process.find().lean();
      if (!holidays.length) holidays = inMemoryHolidays;
      if (!processes.length) processes = seedProcesses;
    } else {
      holidays = inMemoryHolidays;
      processes = seedProcesses;
    }

    // Process impact logic:
    // Important requirement: "Public holidays must be applied according to the operating rules of each brand and process. A 365-day process still needs coverage on holidays."
    const processImpact = processes.map((proc) => {
      const is365Day = proc.operatingRule === '365-day operation' || proc.publicHolidaysOff === false;
      return {
        brand: proc.brand,
        processName: proc.name,
        operatingRule: proc.operatingRule,
        holidayCoverageRequired: is365Day, // TRUE: Process still needs coverage on holidays!
        holidayOffGranted: !is365Day,      // FALSE: Team does not shut down on holidays
        minimumStaffOnHoliday: is365Day ? proc.minimumStaff : 0
      };
    });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
      processImpactBreakdown: {
        totalProcesses: processes.length,
        processesNeedingHolidayCoverage: processImpact.filter((p) => p.holidayCoverageRequired).length,
        processesObservingHolidayOff: processImpact.filter((p) => p.holidayOffGranted).length,
        details: processImpact
      }
    });
  } catch (error) {
    console.error('getHolidays Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/availability/holidays
// Add Holiday: Holiday name, Date, Applicable region or group
export const createHoliday = async (req, res) => {
  try {
    const {
      name,
      date,
      applicableRegionOrGroup = 'All Regions',
      type = 'Gazetted',
      description = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Holiday name is required.' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Holiday date is required.' });
    }

    const dateObj = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = isNaN(dateObj.getTime()) ? 'Thursday' : dayNames[dateObj.getDay()];

    const holidayData = {
      name: name.trim(),
      date,
      dayOfWeek,
      applicableRegionOrGroup: applicableRegionOrGroup || 'All Regions',
      type: type || 'Gazetted',
      affectedPods: ['All Pods'],
      isFloating: false,
      description: description.trim()
    };

    const dbStatus = getDBStatus();
    let savedHoliday = null;

    if (dbStatus.connected) {
      savedHoliday = await Holiday.create(holidayData);
    } else {
      savedHoliday = {
        ...holidayData,
        _id: `mem-hol-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      inMemoryHolidays.push(savedHoliday);
      inMemoryHolidays.sort((a, b) => (a.date > b.date ? 1 : -1));
    }

    res.status(201).json({
      success: true,
      message: `Public holiday "${savedHoliday.name}" added successfully.`,
      data: savedHoliday
    });
  } catch (error) {
    console.error('createHoliday Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/availability/holidays/:id
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, applicableRegionOrGroup, type, description } = req.body;
    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (date) {
        updateData.date = date;
        const dObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        updateData.dayOfWeek = dayNames[dObj.getDay()];
      }
      if (applicableRegionOrGroup) updateData.applicableRegionOrGroup = applicableRegionOrGroup;
      if (type) updateData.type = type;
      if (description !== undefined) updateData.description = description.trim();

      updated = await Holiday.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }

    if (!updated) {
      const idx = inMemoryHolidays.findIndex((h) => h._id === id);
      if (idx !== -1) {
        if (name) inMemoryHolidays[idx].name = name.trim();
        if (date) {
          inMemoryHolidays[idx].date = date;
          const dObj = new Date(date);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          inMemoryHolidays[idx].dayOfWeek = dayNames[dObj.getDay()];
        }
        if (applicableRegionOrGroup) inMemoryHolidays[idx].applicableRegionOrGroup = applicableRegionOrGroup;
        if (type) inMemoryHolidays[idx].type = type;
        if (description !== undefined) inMemoryHolidays[idx].description = description.trim();
        updated = inMemoryHolidays[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Holiday updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('updateHoliday Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/availability/holidays/:id
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let deleted = false;

    if (dbStatus.connected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const result = await Holiday.findByIdAndDelete(id);
      if (result) deleted = true;
    }

    const idx = inMemoryHolidays.findIndex((h) => h._id === id);
    if (idx !== -1) {
      inMemoryHolidays.splice(idx, 1);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Public holiday deleted successfully.'
    });
  } catch (error) {
    console.error('deleteHoliday Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
