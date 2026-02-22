import bcrypt from 'bcryptjs';
import db from '../config/database';
import { runMigrations } from './migrate';
import { BCRYPT_ROUNDS } from '../config/constants';

async function seed() {
  runMigrations();

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (existingUser) {
    console.log('ℹ️  User "admin" already exists, skipping seed.');
    process.exit(0);
  }

  const password = process.argv[2] || 'changeme123';
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);

  console.log('✅ Seeded user: admin');
  console.log(`   Password: ${password}`);
  console.log('   ⚠️  Change this password after first login!');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
