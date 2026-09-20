const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  if (fs.existsSync(tmpDbPath)) {
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

module.exports = prisma;
