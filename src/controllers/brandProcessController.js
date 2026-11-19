import Brand from '../models/Brand.js';
import Process from '../models/Process.js';
import Employee from '../models/Employee.js';
import { getDBStatus } from '../config/db.js';
import { seedBrands, seedProcesses, seedEmployees } from '../data/seedData.js';

let inMemoryBrandList = [...seedBrands];
let inMemoryProcessList = [...seedProcesses];

// Helper to compute brand enrichment (processes, employee count, coverage status)
const enrichBrand = (brand, allProcesses = [], allEmployees = []) => {
  const brandProcesses = allProcesses.filter((p) => p.brand === brand.name);
  const brandEmployees = allEmployees.filter((e) => e.brand === brand.name);

  const coverage = brand.currentCoverage ?? 92;
  const target = brand.targetCoverage ?? 95;
  let coverageStatus = 'Optimal';
  if (coverage < target - 5) coverageStatus = 'Critical';
  else if (coverage < target) coverageStatus = 'Warning';

  return {
    ...brand,
    _id: brand._id || `mem-brand-${brand.code}`,
    processes: brandProcesses.map((p) => p.name),
    processesList: brandProcesses,
    employeesCount: brandEmployees.length,
    employees: brandEmployees,
    coverageStatus
  };
};

// GET /api/brands
export const getBrands = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let brands = [];
    let processes = [];
    let employees = [];

    if (dbStatus.connected) {
      brands = await Brand.find().lean();
      processes = await Process.find().lean();
      employees = await Employee.find({ status: { $ne: 'Inactive' } }).lean();

      if (!brands.length) {
        brands = inMemoryBrandList;
        processes = inMemoryProcessList;
        employees = seedEmployees;
      }
    } else {
      brands = inMemoryBrandList;
      processes = inMemoryProcessList;
      employees = seedEmployees;
    }

    const enriched = brands.map((b) => enrichBrand(b, processes, employees));

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('getBrands Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/brands/:id
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let brand = null;
    let processes = [];
    let employees = [];

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        brand = await Brand.findById(id).lean();
      }
      if (!brand) {
        brand = await Brand.findOne({ $or: [{ name: id }, { code: id.toUpperCase() }] }).lean();
      }
      processes = await Process.find().lean();
      employees = await Employee.find().lean();
    }

    if (!brand) {
      brand = inMemoryBrandList.find(
        (b) => b.name === id || b.code === id || b.code === id.toUpperCase() || b._id === id
      );
      processes = inMemoryProcessList;
      employees = seedEmployees;
    }

    if (!brand) {
      return res.status(404).json({ success: false, message: `Brand ${id} not found.` });
    }

    const enriched = enrichBrand(brand, processes, employees);

    res.status(200).json({
      success: true,
      data: {
        brand: enriched,
        overview: {
          name: enriched.name,
          code: enriched.code,
          description: enriched.description,
          status: enriched.status,
          targetCoverage: enriched.targetCoverage,
          currentCoverage: enriched.currentCoverage,
          coverageStatus: enriched.coverageStatus,
          processesCount: enriched.processes.length,
          employeesCount: enriched.employeesCount,
          assignedEmployees: enriched.employees
        },
        processes: enriched.processesList,
        operatingRules: enriched.processesList.map((p) => ({
          processId: p._id || p.name,
          name: p.name,
          status: p.status,
          minimumStaff: p.minimumStaff || 1,
          operatingRule: p.operatingRule || 'Sundays and public holidays off',
          workingDays: p.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          publicHolidaysOff: p.publicHolidaysOff ?? true,
          shiftTiming: p.shiftTiming || 'Day (08:00 - 17:00)',
          slaTarget: p.slaTarget || '99%'
        }))
      }
    });
  } catch (error) {
    console.error('getBrandById Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/brands (Add Brand)
export const createBrand = async (req, res) => {
  try {
    const { name, code, description, status = 'Active', color, targetCoverage } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Brand name and code are required.' });
    }

    const brandData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || 'Client portfolio for enterprise operations',
      status: status || 'Active',
      color: color || '#3b82f6',
      targetCoverage: Number(targetCoverage) || 95,
      currentCoverage: 92
    };

    const dbStatus = getDBStatus();
    let saved = null;

    if (dbStatus.connected) {
      const existing = await Brand.findOne({ $or: [{ name: brandData.name }, { code: brandData.code }] });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Brand with this name or code already exists.' });
      }
      saved = await Brand.create(brandData);
    } else {
      const exists = inMemoryBrandList.some((b) => b.name === brandData.name || b.code === brandData.code);
      if (exists) {
        return res.status(400).json({ success: false, message: 'Brand with this name or code already exists.' });
      }
      inMemoryBrandList = [brandData, ...inMemoryBrandList];
      saved = brandData;
    }

    res.status(201).json({
      success: true,
      message: `Brand ${name} (${brandData.code}) added successfully!`,
      data: saved
    });
  } catch (error) {
    console.error('createBrand Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/brands/:id
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.code) updateData.code = updateData.code.toUpperCase();

    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        updated = await Brand.findByIdAndUpdate(id, updateData, { new: true });
      }
      if (!updated) {
        updated = await Brand.findOneAndUpdate({ name: id }, updateData, { new: true });
      }
    }

    const memIdx = inMemoryBrandList.findIndex((b) => b.name === id || b.code === id || b._id === id);
    if (memIdx !== -1) {
      inMemoryBrandList[memIdx] = { ...inMemoryBrandList[memIdx], ...updateData };
      if (!updated) updated = inMemoryBrandList[memIdx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: `Brand ${id} not found.` });
    }

    res.status(200).json({
      success: true,
      message: `Brand ${updated.name} updated successfully!`,
      data: updated
    });
  } catch (error) {
    console.error('updateBrand Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/brands/:id
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Brand.findByIdAndDelete(id);
      } else {
        await Brand.findOneAndDelete({ name: id });
      }
    }

    inMemoryBrandList = inMemoryBrandList.filter((b) => b.name !== id && b.code !== id && b._id !== id);

    res.status(200).json({
      success: true,
      message: `Brand ${id} deleted.`
    });
  } catch (error) {
    console.error('deleteBrand Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// PROCESS MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// GET /api/processes (List all processes)
export const getProcesses = async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let processes = [];
    if (dbStatus.connected) {
      try {
        processes = await Process.find();
      } catch (e) {
        processes = inMemoryProcessList;
      }
    } else {
      processes = inMemoryProcessList;
    }

    res.status(200).json({
      success: true,
      count: processes.length,
      data: processes
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      count: inMemoryProcessList.length,
      data: inMemoryProcessList
    });
  }
};

// POST /api/processes (Add Process)
export const createProcess = async (req, res) => {
  try {
    const {
      name,
      brand,
      pod,
      status = 'Active',
      minimumStaff = 1,
      operatingRule = 'Sundays and public holidays off',
      workingDays,
      publicHolidaysOff,
      shiftTiming,
      slaTarget,
      description
    } = req.body;

    if (!name || !brand) {
      return res.status(400).json({ success: false, message: 'Process name and brand are required.' });
    }

    const processData = {
      name: name.trim(),
      brand: brand.trim(),
      pod: pod || 'Pod Alpha (Inbound Core)',
      status: status || 'Active',
      minimumStaff: Number(minimumStaff) || 1,
      operatingRule: operatingRule || 'Sundays and public holidays off',
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      publicHolidaysOff: publicHolidaysOff !== undefined ? publicHolidaysOff : true,
      shiftTiming: shiftTiming || 'Day (08:00 - 17:00)',
      slaTarget: slaTarget || '99%',
      description: description || ''
    };

    const dbStatus = getDBStatus();
    let saved = null;

    if (dbStatus.connected) {
      saved = await Process.create(processData);
    } else {
      processData._id = `mem-proc-${Date.now()}`;
      inMemoryProcessList = [processData, ...inMemoryProcessList];
      saved = processData;
    }

    res.status(201).json({
      success: true,
      message: `Process ${name} added under brand ${brand}!`,
      data: saved
    });
  } catch (error) {
    console.error('createProcess Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/processes/:id (Edit Process / Operating Rules)
export const updateProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        updated = await Process.findByIdAndUpdate(id, updateData, { new: true });
      }
      if (!updated) {
        updated = await Process.findOneAndUpdate({ name: id }, updateData, { new: true });
      }
    }

    const memIdx = inMemoryProcessList.findIndex((p) => p._id === id || p.name === id);
    if (memIdx !== -1) {
      inMemoryProcessList[memIdx] = { ...inMemoryProcessList[memIdx], ...updateData };
      if (!updated) updated = inMemoryProcessList[memIdx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: `Process ${id} not found.` });
    }

    res.status(200).json({
      success: true,
      message: `Process ${updated.name} updated successfully!`,
      data: updated
    });
  } catch (error) {
    console.error('updateProcess Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/processes/:id/status (Deactivate / Activate Process)
export const toggleProcessStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'Inactive' } = req.body;

    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        updated = await Process.findByIdAndUpdate(id, { status }, { new: true });
      }
      if (!updated) {
        updated = await Process.findOneAndUpdate({ name: id }, { status }, { new: true });
      }
    }

    const memIdx = inMemoryProcessList.findIndex((p) => p._id === id || p.name === id);
    if (memIdx !== -1) {
      inMemoryProcessList[memIdx].status = status;
      if (!updated) updated = inMemoryProcessList[memIdx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: `Process ${id} not found.` });
    }

    res.status(200).json({
      success: true,
      message: `Process ${updated.name} status set to ${status}`,
      data: updated
    });
  } catch (error) {
    console.error('toggleProcessStatus Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/processes/:id
export const deleteProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Process.findByIdAndDelete(id);
      } else {
        await Process.findOneAndDelete({ name: id });
      }
    }

    inMemoryProcessList = inMemoryProcessList.filter((p) => p._id !== id && p.name !== id);

    res.status(200).json({
      success: true,
      message: `Process ${id} deleted.`
    });
  } catch (error) {
    console.error('deleteProcess Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
