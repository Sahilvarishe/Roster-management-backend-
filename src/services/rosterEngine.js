// Brand-Process Calendar Rules & Operating Schedules
export const brandProcessCalendars = {
  'Apex Retail': {
    'L1 Inbound Voice Support': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      defaultShift: 'Day (08:00 - 17:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 1,
      is24x7: false
    },
    'Live Chat & Returns Triage': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: 'Day (08:00 - 17:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 0,
      is24x7: false
    },
    'Tier 2 Escalations Resolution': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      defaultShift: 'Evening (14:00 - 23:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 1,
      is24x7: false
    },
    'High-Value VIP Order Care': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: 'Evening (14:00 - 23:00)',
      requiredStaffingWeekday: 1,
      requiredStaffingWeekend: 0,
      is24x7: false
    }
  },
  'Nova Logistics': {
    'Fleet Urgent Telemetry Alerts': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      defaultShift: 'Night (22:00 - 07:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 2,
      is24x7: true
    },
    'Express Freight Rerouting': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      defaultShift: 'Night (22:00 - 07:00)',
      requiredStaffingWeekday: 1,
      requiredStaffingWeekend: 1,
      is24x7: false
    },
    'Corporate Account Dispatch': {
      operatingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      defaultShift: 'Day (09:00 - 18:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 1,
      is24x7: false
    }
  },
  'Zenith Health': {
    'Critical Patient Transport Desk': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      defaultShift: 'Rotational 24/7',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 2,
      is24x7: true
    },
    'Pre-Authorization Claims Processing': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: 'Day (09:00 - 18:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 0,
      is24x7: false
    }
  },
  'Echo Telecom': {
    'Fiber Broadband Fault Diagnosis': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      defaultShift: 'Day (08:00 - 17:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 1,
      is24x7: false
    },
    'Enterprise SLA Incident Desk': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: 'Day (08:00 - 17:00)',
      requiredStaffingWeekday: 1,
      requiredStaffingWeekend: 0,
      is24x7: false
    },
    'Commercial Disputes & Invoicing': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: 'Mid-Day (11:00 - 20:00)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 0,
      is24x7: false
    }
  },
  'Pulse Media': {
    'Global Content Review': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      defaultShift: 'Rotational (24/7)',
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 2,
      is24x7: true
    },
    'Account Access & Security Recovery': {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      defaultShift: 'Rotational (24/7)',
      requiredStaffingWeekday: 1,
      requiredStaffingWeekend: 1,
      is24x7: false
    }
  }
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generate monthly roster assignments respecting each brand-process calendar,
 * employee assigned weekly offs, approved leaves, and public holidays.
 */
export const generateMonthlyRoster = ({
  monthName,
  year = 2026,
  employees = [],
  leaves = [],
  holidays = []
}) => {
  const monthIndex = monthNames.indexOf(monthName) !== -1 ? monthNames.indexOf(monthName) : 10;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const assignments = [];

  employees.forEach((emp) => {
    let consecutiveWorkingDays = 0;

    const brandSchedule = brandProcessCalendars[emp.brand] || {};
    const processSchedule = brandSchedule[emp.process] || {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: emp.shift || 'Day (08:00 - 17:00)',
      is24x7: false
    };

    const weeklyOffs = emp.weeklyOffDays || ['Saturday', 'Sunday'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, monthIndex, day);
      const dayOfWeekIndex = dateObj.getDay();
      const fullDayName = dayNames[dayOfWeekIndex];
      const shortDayName = shortDayNames[dayOfWeekIndex];

      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // 1. Check for Approved / Active Leaves
      const matchingLeave = leaves.find((l) => {
        if (l.employeeId !== emp.employeeId && l.employeeName !== emp.name) return false;
        return dateStr >= l.startDate && dateStr <= l.endDate;
      });

      // 2. Check for Public Holidays
      const matchingHoliday = holidays.find((h) => h.date === dateStr);

      let status = 'Working';
      let shift = processSchedule.defaultShift || emp.shift || 'Day (08:00 - 17:00)';
      let leaveType = null;
      let holidayName = null;
      let conflictReason = null;

      // Logic:
      if (matchingLeave) {
        status = 'Leave';
        shift = 'Off (Leave)';
        leaveType = matchingLeave.leaveType || 'Casual';
        consecutiveWorkingDays = 0;
      } else if (matchingHoliday && !processSchedule.is24x7) {
        status = 'Holiday';
        shift = 'Off (Holiday)';
        holidayName = matchingHoliday.name;
        consecutiveWorkingDays = 0;
      } else if (weeklyOffs.includes(fullDayName)) {
        status = 'Weekly Off';
        shift = 'Off (Weekly Rest)';
        consecutiveWorkingDays = 0;
      } else if (!processSchedule.operatingDays.includes(fullDayName)) {
        status = 'Weekly Off';
        shift = 'Off (Process Inactive)';
        consecutiveWorkingDays = 0;
      } else {
        // Working day
        consecutiveWorkingDays++;
        if (consecutiveWorkingDays >= 7) {
          status = 'Conflict';
          conflictReason = 'Exceeded maximum 6 consecutive work days without 36h statutory rest';
        }
      }

      // Deliberate simulated known conflicts for operational test cases:
      if (emp.name === 'Carlos Mendez' && day === 20) {
        status = 'Conflict';
        conflictReason = 'Double-booking overlap with Pod Alpha Day & Pod Gamma Night shift';
      }
      if (emp.name === 'Maya Lin' && day === 23) {
        status = 'Conflict';
        conflictReason = 'Roster shift assigned on approved Annual Leave date';
      }

      assignments.push({
        month: monthName,
        monthIndex,
        year,
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek: shortDayName,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        brand: emp.brand,
        pod: emp.pod,
        process: emp.process,
        status,
        shift: status === 'Working' ? shift : status === 'Conflict' ? shift : 'Off',
        leaveType,
        holidayName,
        conflictReason,
        notes: status === 'Conflict' ? conflictReason : ''
      });
    }
  });

  return assignments;
};

/**
 * Validate roster assignments against staffing minimums, rest rules, and conflict clashes.
 */
export const validateRoster = (assignments = [], processes = []) => {
  const issues = [];
  let totalWorkingShifts = 0;
  let totalConflicts = 0;

  // 1. Count conflicts and working shifts
  assignments.forEach((a) => {
    if (a.status === 'Working') totalWorkingShifts++;
    if (a.status === 'Conflict') {
      totalConflicts++;
      issues.push({
        severity: 'High',
        type: 'Individual Assignment Conflict',
        employee: a.employeeName,
        date: a.date,
        pod: a.pod,
        brand: a.brand,
        message: a.conflictReason || `Conflict detected on ${a.date} for ${a.employeeName}`
      });
    }
  });

  // 2. Check process coverage gaps per date
  // Group assignments by date & process
  const dateProcessMap = {};
  assignments.forEach((a) => {
    const key = `${a.date}_${a.process}`;
    if (!dateProcessMap[key]) {
      dateProcessMap[key] = {
        date: a.date,
        dayOfWeek: a.dayOfWeek,
        process: a.process,
        brand: a.brand,
        pod: a.pod,
        workingCount: 0
      };
    }
    if (a.status === 'Working') {
      dateProcessMap[key].workingCount++;
    }
  });

  let totalGaps = 0;
  Object.values(dateProcessMap).forEach((dp) => {
    const brandSchedule = brandProcessCalendars[dp.brand] || {};
    const pSchedule = brandSchedule[dp.process];

    if (pSchedule) {
      const isWeekend = dp.dayOfWeek === 'Sat' || dp.dayOfWeek === 'Sun';
      const required = isWeekend ? pSchedule.requiredStaffingWeekend : pSchedule.requiredStaffingWeekday;

      if (required > 0 && dp.workingCount < required) {
        totalGaps++;
        issues.push({
          severity: required - dp.workingCount >= 2 ? 'High' : 'Medium',
          type: 'Process Staffing Gap',
          process: dp.process,
          date: dp.date,
          pod: dp.pod,
          brand: dp.brand,
          message: `${dp.process} has ${dp.workingCount} available vs ${required} required staff on ${dp.date} (${dp.dayOfWeek})`
        });
      }
    }
  });

  const totalEvaluated = assignments.length;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (totalConflicts * 4 + totalGaps * 1.5))));

  return {
    isValid: totalConflicts === 0,
    healthScore,
    totalWorkingShifts,
    totalConflicts,
    totalGaps,
    totalIssues: issues.length,
    issues: issues.slice(0, 25), // top 25 issues for responsive display
    validatedAt: new Date().toISOString()
  };
};

/**
 * Calculate process coverage summary for a specific date or whole month.
 */
export const calculateCoverageSummary = (assignments = [], targetDate = null) => {
  const summary = [];

  // Find unique processes
  const processKeys = {};
  assignments.forEach((a) => {
    if (!processKeys[a.process]) {
      processKeys[a.process] = {
        process: a.process,
        brand: a.brand,
        pod: a.pod
      };
    }
  });

  Object.values(processKeys).forEach((p) => {
    const brandSchedule = brandProcessCalendars[p.brand] || {};
    const pSchedule = brandSchedule[p.process] || {
      requiredStaffingWeekday: 2,
      requiredStaffingWeekend: 1
    };

    let pAssignments = assignments.filter((a) => a.process === p.process);
    if (targetDate) {
      pAssignments = pAssignments.filter((a) => a.date === targetDate);
    }

    const available = pAssignments.filter((a) => a.status === 'Working').length;
    
    // For single target date vs whole month
    let required = pSchedule.requiredStaffingWeekday;
    if (targetDate) {
      const d = new Date(targetDate);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      required = isWeekend ? pSchedule.requiredStaffingWeekend : pSchedule.requiredStaffingWeekday;
    } else {
      // Monthly average per day
      required = pSchedule.requiredStaffingWeekday;
    }

    let status = 'Covered';
    if (available < required) status = 'Gap';
    else if (available > required) status = 'Surplus';

    summary.push({
      process: p.process,
      brand: p.brand,
      pod: p.pod,
      required,
      available,
      difference: available - required,
      status
    });
  });

  return summary;
};
