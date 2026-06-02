/**
 * Seed script — populates development / test data.
 * Run once after migrations: npm run seed
 */
import { getDb } from './database';
import { runMigrations } from './migrate';
import bcrypt from 'bcryptjs';
import { config } from '../config';

const db = getDb();
runMigrations(db);

function seed() {
  const insert = db.transaction(() => {
    const adminId = '00000000-0000-4000-8000-000000000001';
    const staffUserId = '00000000-0000-4000-8000-000000000002';
    const mentorUserId = '00000000-0000-4000-8000-000000000003';
    const workshopUserId = '00000000-0000-4000-8000-000000000004';
    const mentorTwoUserId = '00000000-0000-4000-8000-000000000005';
    const workshopTwoUserId = '00000000-0000-4000-8000-000000000006';
    const outreachTwoUserId = '00000000-0000-4000-8000-000000000007';
    const busyMentorUserId = '00000000-0000-4000-8000-000000000008';
    const leaveWorkshopUserId = '00000000-0000-4000-8000-000000000009';

    // Admin user
    const adminHash = bcrypt.hashSync('Dev@dmin123!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_admin', 1)
    `).run(adminId, 'admin@oyci.internal', adminHash);

    // Standard staff user
    const staffHash = bcrypt.hashSync('St@ff123!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(staffUserId, 'staff@oyci.internal', staffHash);

    const mentorHash = bcrypt.hashSync('Ment0r12345!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(mentorUserId, 'mentor@oyci.internal', mentorHash);

    const workshopHash = bcrypt.hashSync('Worksh0p123!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(workshopUserId, 'workshop@oyci.internal', workshopHash);

    const mentorTwoHash = bcrypt.hashSync('Ment0rTwo123!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(mentorTwoUserId, 'mentor2@oyci.internal', mentorTwoHash);

    const workshopTwoHash = bcrypt.hashSync('Worksh0pTwo1!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(workshopTwoUserId, 'workshop2@oyci.internal', workshopTwoHash);

    const outreachTwoHash = bcrypt.hashSync('Outreach1234!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(outreachTwoUserId, 'outreach2@oyci.internal', outreachTwoHash);

    const busyMentorHash = bcrypt.hashSync('BusyMentor12!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(busyMentorUserId, 'busymentor@oyci.internal', busyMentorHash);

    const leaveWorkshopHash = bcrypt.hashSync('LeaveWork123!', config.bcryptRounds);
    db.prepare(`
      INSERT OR IGNORE INTO user_accounts (id, email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 'role_staff', 1)
    `).run(leaveWorkshopUserId, 'leaveworkshop@oyci.internal', leaveWorkshopHash);

    // Staff skills used by non-standard session types
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(mentorUserId, 'mentoring');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(mentorTwoUserId, 'mentoring');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(busyMentorUserId, 'mentoring');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(workshopUserId, 'workshop');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(workshopTwoUserId, 'workshop');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(leaveWorkshopUserId, 'workshop');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(staffUserId, 'outreach');
    db.prepare(`INSERT OR IGNORE INTO staff_skills (user_id, session_type) VALUES (?, ?)`)
      .run(outreachTwoUserId, 'outreach');

    // Availability data to test overlap filtering
    db.prepare(`
      INSERT OR IGNORE INTO staff_availability (id, user_id, start_time, end_time, leave_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      '10000000-0000-4000-8000-000000000001',
      workshopUserId,
      '2026-07-06T13:30:00',
      '2026-07-06T15:30:00',
      'busy',
    );

    db.prepare(`
      INSERT OR IGNORE INTO staff_availability (id, user_id, start_time, end_time, leave_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      '10000000-0000-4000-8000-000000000002',
      mentorUserId,
      '2026-07-07T09:00:00',
      '2026-07-07T12:00:00',
      'leave',
    );

    // These two are intentionally unavailable for non-standard sessions around 2026-07-08 13:00-16:00
    db.prepare(`
      INSERT OR IGNORE INTO staff_availability (id, user_id, start_time, end_time, leave_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      '10000000-0000-4000-8000-000000000003',
      busyMentorUserId,
      '2026-07-08T13:00:00',
      '2026-07-08T16:00:00',
      'busy',
    );

    db.prepare(`
      INSERT OR IGNORE INTO staff_availability (id, user_id, start_time, end_time, leave_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      '10000000-0000-4000-8000-000000000004',
      leaveWorkshopUserId,
      '2026-07-08T12:30:00',
      '2026-07-08T15:30:00',
      'leave',
    );

    // Sessions data for the frontend list and allocation testing
    db.prepare(`
      INSERT OR IGNORE INTO sessions
        (id, title, description, start_time, end_time, location, session_type, notes, attendees, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '20000000-0000-4000-8000-000000000001',
      'Standard Drop-in',
      'General youth drop-in session',
      '2026-07-06T13:00:00',
      '2026-07-06T16:00:00',
      'Community Hall',
      'standard',
      'Bring sign-in sheets',
      18,
      adminId,
    );

    db.prepare(`
      INSERT OR IGNORE INTO sessions
        (id, title, description, start_time, end_time, location, session_type, notes, attendees, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '20000000-0000-4000-8000-000000000002',
      'Mentoring Circle',
      'Small group mentoring',
      '2026-07-07T13:00:00',
      '2026-07-07T15:00:00',
      'OYCI Room 2',
      'mentoring',
      'Needs mentoring-skilled staff',
      10,
      adminId,
    );

    // Example allocations for seeded sessions
    db.prepare(`INSERT OR IGNORE INTO staff_allocation (session_id, user_id) VALUES (?, ?)`)
      .run('20000000-0000-4000-8000-000000000001', staffUserId);
    db.prepare(`INSERT OR IGNORE INTO staff_allocation (session_id, user_id) VALUES (?, ?)`)
      .run('20000000-0000-4000-8000-000000000002', mentorUserId);

    console.log('[seed] Development seed data inserted.');
    console.log('[seed] Admin login:  admin@oyci.internal / Dev@dmin123!');
    console.log('[seed] Staff login:  staff@oyci.internal / St@ff123!');
    console.log('[seed] Mentor login: mentor@oyci.internal / Ment0r12345!');
    console.log('[seed] Workshop login: workshop@oyci.internal / Worksh0p123!');
    console.log('[seed] Mentor2 login: mentor2@oyci.internal / Ment0rTwo123!');
    console.log('[seed] Workshop2 login: workshop2@oyci.internal / Worksh0pTwo1!');
    console.log('[seed] Outreach2 login: outreach2@oyci.internal / Outreach1234!');
    console.log('[seed] Busy mentor login: busymentor@oyci.internal / BusyMentor12!');
    console.log('[seed] Leave workshop login: leaveworkshop@oyci.internal / LeaveWork123!');
    console.log('[seed] NOTE: Change these credentials immediately in any non-dev environment.');
  });

  insert();
}

seed();
