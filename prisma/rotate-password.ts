import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  const password = process.env.NEW_PASSWORD;

  if (!email || !password) {
    console.error(
      'Usage: NEW_PASSWORD=\'<new-password>\' npm run user:set-password -- <email>',
    );
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Use a password of at least 12 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await prisma.user.updateMany({
    where: { email, deletedAt: null },
    // Bumping tokenVersion revokes every access/refresh token for the account.
    data: { password: hash, tokenVersion: { increment: 1 } },
  });

  if (result.count === 0) {
    console.error(`No active user found for ${email}`);
    process.exit(1);
  }

  console.log(`Password rotated for ${email}; existing sessions revoked.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
