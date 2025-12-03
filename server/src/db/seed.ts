import { db } from '../services/db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  // Check if default user exists
  const existingUser = await db.select().from(users).where(eq(users.email, 'admin@nodebook.local'));

  if (existingUser.length > 0) {
    console.log('Default user already exists');
    return;
  }

  // Create default user
  const passwordHash = await bcrypt.hash('password123', 12);

  await db.insert(users).values({
    email: 'admin@nodebook.local',
    passwordHash,
    name: 'Admin',
  });

  console.log('Default user created:');
  console.log('  Email: admin@nodebook.local');
  console.log('  Password: password123');
  console.log('Seeding completed!');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
