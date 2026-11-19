import { login, getMe, memoryUsers } from '../src/controllers/authController.js';
import { getUsers, createUser } from '../src/controllers/userController.js';
import { submitLeaveRequest, getMyLeaveRequests, getPodLeaveRequests, reviewLeaveRequest } from '../src/controllers/leaveController.js';
import { getProcesses } from '../src/controllers/brandProcessController.js';

// Helper mock response
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = val;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RBAC & AUTHENTICATION COMPREHENSIVE VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${desc}`);
    } else {
      console.error(`❌ [FAIL] ${desc}`);
    }
  }

  // TEST 1: Admin Login
  {
    const req = { body: { email: 'admin@datastraw.io', password: 'Admin@12345' } };
    const res = createMockRes();
    await login(req, res);
    assert(res.statusCode === 200 && res.body?.token && res.body?.user?.role === 'admin', 'Admin login with seed credentials succeeds');
  }

  // TEST 2: Ops Manager Login
  {
    const req = { body: { email: 'ops.manager@datastraw.io', password: 'Ops@12345' } };
    const res = createMockRes();
    await login(req, res);
    assert(res.statusCode === 200 && res.body?.user?.role === 'operations_manager', 'Operations Manager login succeeds');
  }

  // TEST 3: Pod Lead Login
  let leadTokenUser = null;
  {
    const req = { body: { email: 'pod.lead@datastraw.io', password: 'Lead@12345' } };
    const res = createMockRes();
    await login(req, res);
    leadTokenUser = res.body?.user;
    assert(res.statusCode === 200 && res.body?.user?.role === 'pod_lead' && res.body?.user?.podId, 'Pod Lead login returns podId scope');
  }

  // TEST 4: Employee Login
  let empTokenUser = null;
  {
    const req = { body: { email: 'employee@datastraw.io', password: 'Emp@12345' } };
    const res = createMockRes();
    await login(req, res);
    empTokenUser = res.body?.user;
    assert(res.statusCode === 200 && res.body?.user?.role === 'employee' && res.body?.user?.employeeId === 'EMP002', 'Employee login returns employeeId scope');
  }

  // TEST 5: getMe endpoint resilient session
  {
    const req = { user: empTokenUser };
    const res = createMockRes();
    await getMe(req, res);
    assert(res.statusCode === 200 && res.body?.data?.email === 'employee@datastraw.io', 'getMe returns authenticated user session without 500 error');
  }

  // TEST 6: GET /api/processes
  {
    const req = {};
    const res = createMockRes();
    await getProcesses(req, res);
    assert(res.statusCode === 200 && Array.isArray(res.body?.data) && res.body.data.length > 0, 'getProcesses returns process directory');
  }

  // TEST 7: Employee submits leave request
  let leaveId = null;
  {
    const req = {
      user: empTokenUser,
      body: {
        leaveType: 'Planned Leave',
        startDate: '2026-11-25',
        endDate: '2026-11-26',
        reason: 'Family event'
      }
    };
    const res = createMockRes();
    await submitLeaveRequest(req, res);
    leaveId = res.body?.data?._id;
    assert(res.statusCode === 201 && leaveId && res.body?.data?.status === 'Pending', 'Employee can apply for leave');
  }

  // TEST 8: Employee views their own leave requests
  {
    const req = { user: empTokenUser };
    const res = createMockRes();
    await getMyLeaveRequests(req, res);
    assert(res.statusCode === 200 && res.body?.data?.some((l) => l._id === leaveId), 'Employee can view their own leave requests');
  }

  // TEST 9: Pod Lead reviews and approves leave request
  {
    const req = {
      user: leadTokenUser,
      params: { id: leaveId },
      body: {
        status: 'Approved',
        reviewerComments: 'Approved by Lead for Pod Alpha'
      }
    };
    const res = createMockRes();
    await reviewLeaveRequest(req, res);
    assert(res.statusCode === 200 && res.body?.data?.status === 'Approved', 'Pod Lead can approve leave within their pod');
  }

  // TEST 10: Privilege Escalation Prevention - Ops Manager attempting to create Admin
  {
    const req = {
      user: { role: 'operations_manager', email: 'ops.manager@datastraw.io' },
      body: {
        name: 'Attacker Admin',
        email: 'attacker@datastraw.io',
        password: 'Password123',
        role: 'admin'
      }
    };
    const res = createMockRes();
    await createUser(req, res);
    assert(res.statusCode === 403, 'Operations Manager is strictly blocked from creating Admin accounts');
  }

  console.log(`\n======================================================`);
  console.log(`📊 RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('======================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Unhandled test failure:', e);
  process.exit(1);
});
