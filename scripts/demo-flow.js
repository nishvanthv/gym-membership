require('dotenv').config();

const BASE = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const health = await req('GET', '/api/health');
  assert(health.status === 200, 'Health check failed. Is the server running?');

  const stamp = Date.now();
  const adminLogin = await req('POST', '/api/auth/login', {
    body: { email: 'admin@gym.local', password: 'Admin@123' }
  });
  assert(adminLogin.status === 200, 'Admin login failed. Run npm run seed first.');
  const adminToken = adminLogin.data.data.token;

  const plan = await req('POST', '/api/plans', {
    token: adminToken,
    body: { name: `Premium-${stamp}`, durationMonths: 1, price: 1499, description: 'Demo plan' }
  });
  assert(plan.status === 201, 'Plan create failed: ' + plan.data.message);
  const planId = plan.data.data._id;

  const trainer = await req('POST', '/api/trainers', {
    token: adminToken,
    body: {
      name: 'Yoga Coach',
      email: `trainer-${stamp}@gym.local`,
      password: 'Trainer@123',
      specialization: 'Yoga'
    }
  });
  assert(trainer.status === 201, 'Trainer create failed: ' + trainer.data.message);
  const trainerUserId = trainer.data.data.user._id;

  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const gymClass = await req('POST', '/api/classes', {
    token: adminToken,
    body: {
      trainerId: trainerUserId,
      title: 'Yoga',
      description: 'Demo yoga',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      capacity: 2
    }
  });
  assert(gymClass.status === 201, 'Class create failed: ' + gymClass.data.message);
  const classId = gymClass.data.data._id;

  async function createMember(label) {
    const registered = await req('POST', '/api/auth/register', {
      body: {
        name: label,
        email: `${label.toLowerCase().replace(/\s/g, '')}-${stamp}@gym.local`,
        password: 'Member@123'
      }
    });
    assert(registered.status === 201, label + ' register failed: ' + registered.data.message);
    const token = registered.data.data.token;
    const purchase = await req('POST', '/api/memberships', { token, body: { planId } });
    assert(purchase.status === 201, label + ' purchase failed: ' + purchase.data.message);
    return { token, id: registered.data.data.user._id };
  }

  const a = await createMember('Member A');
  const bookA = await req('POST', `/api/classes/${classId}/book`, { token: a.token });
  assert(bookA.status === 201 && bookA.data.data.status === 'CONFIRMED', 'A should be CONFIRMED');
  const bookingA = bookA.data.data._id;

  const b = await createMember('Member B');
  const bookB = await req('POST', `/api/classes/${classId}/book`, { token: b.token });
  assert(bookB.status === 201 && bookB.data.data.status === 'CONFIRMED', 'B should be CONFIRMED');

  const c = await createMember('Member C');
  const bookC = await req('POST', `/api/classes/${classId}/book`, { token: c.token });
  assert(bookC.status === 201 && bookC.data.data.status === 'WAITLISTED', 'C should be WAITLISTED, got ' + bookC.data.data.status);

  const cancelA = await req('POST', `/api/bookings/${bookingA}/cancel`, { token: a.token });
  assert(cancelA.status === 200, 'A cancel failed');

  const myC = await req('GET', '/api/bookings/my', { token: c.token });
  const promoted = (myC.data.data || []).find((item) => {
    const cid = item.classId && item.classId._id ? item.classId._id : item.classId;
    return String(cid) === String(classId);
  });
  assert(promoted && promoted.status === 'CONFIRMED', 'C should be promoted to CONFIRMED, got ' + (promoted && promoted.status));

  const checkin = await req('POST', '/api/attendance/checkin', {
    token: c.token,
    body: { type: 'CLASS', classId }
  });
  assert(checkin.status === 201, 'Check-in failed: ' + checkin.data.message);
  assert(checkin.data.data.booking.status === 'ATTENDED', 'Booking should be ATTENDED');

  const trainerLogin = await req('POST', '/api/auth/login', {
    body: { email: `trainer-${stamp}@gym.local`, password: 'Trainer@123' }
  });
  const att = await req('GET', `/api/attendance/class/${classId}`, { token: trainerLogin.data.data.token });
  assert(att.status === 200 && att.data.data.length >= 1, 'Trainer attendance view failed');

  const attReport = await req('GET', '/api/admin/reports/attendance', { token: adminToken });
  const memReport = await req('GET', '/api/admin/reports/memberships', { token: adminToken });
  assert(attReport.status === 200 && memReport.status === 200, 'Reports failed');

  const forbidden = await req('GET', '/api/admin/reports/attendance', { token: a.token });
  assert(forbidden.status === 403, 'Member should not access admin reports');

  console.log('DEMO FLOW PASSED');
  console.log(JSON.stringify({ classId, planId, memberC: c.id, attendance: att.data.data.length }, null, 2));
}

main().catch((err) => {
  console.error('DEMO FLOW FAILED:', err.message);
  process.exit(1);
});
