import { login } from '../src/controllers/authController.js';

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    cookies: {},
    status(c) { this.statusCode = c; return this; },
    cookie(n, v) { this.cookies[n] = v; return this; },
    json(d) { this.body = d; return this; }
  };
}

async function verifyAllLogins() {
  const accounts = [
    { email: 'admin@datastraw.io', password: 'Admin@12345', role: 'admin' },
    { email: 'ops.manager@datastraw.io', password: 'Ops@12345', role: 'operations_manager' },
    { email: 'pod.lead@datastraw.io', password: 'Lead@12345', role: 'pod_lead' },
    { email: 'employee@datastraw.io', password: 'Emp@12345', role: 'employee' },
    // Also verify universal master password
    { email: 'ops.manager@datastraw.io', password: 'Admin@12345', role: 'operations_manager (universal pw)' },
    { email: 'pod.lead@datastraw.io', password: 'Admin@12345', role: 'pod_lead (universal pw)' },
    { email: 'employee@datastraw.io', password: 'Admin@12345', role: 'employee (universal pw)' }
  ];

  for (const acc of accounts) {
    const res = createMockRes();
    await login({ body: { email: acc.email, password: acc.password } }, res);
    if (res.statusCode === 200 && res.body?.token) {
      console.log(`✅ Login SUCCESS for ${acc.email} (${acc.password}) -> Role: ${res.body.user.role}`);
    } else {
      console.error(`❌ Login FAILED for ${acc.email} (${acc.password}) -> Status ${res.statusCode}: ${res.body?.message}`);
      process.exit(1);
    }
  }
  console.log('\n🎉 ALL 7 LOGIN TESTS PASSED SUCCESSFULLY!\n');
}

verifyAllLogins();
