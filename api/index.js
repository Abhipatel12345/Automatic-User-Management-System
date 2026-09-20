// Vercel Serverless Function entrypoint
const fs = require('fs');
const path = require('path');

// Ensure SQLite database is copied to writable /tmp directory on Vercel
if (process.env.VERCEL) {
  try {
    const tmpDbPath = '/tmp/dev.db';
    const candidatePaths = [
      path.join(process.cwd(), 'server', 'prisma', 'dev.db'),
      path.join(__dirname, '..', 'server', 'prisma', 'dev.db'),
      path.join(__dirname, 'dev.db')
    ];

    const foundSource = candidatePaths.find((p) => fs.existsSync(p));

    if (!fs.existsSync(tmpDbPath)) {
      if (foundSource) {
        fs.copyFileSync(foundSource, tmpDbPath);
        console.log(`[Vercel Serverless] Successfully copied database from ${foundSource} to ${tmpDbPath}`);
      } else {
        console.warn('[Vercel Serverless] No source dev.db found in candidates:', candidatePaths);
      }
    }

    if (fs.existsSync(tmpDbPath)) {
      process.env.DATABASE_URL = `file:${tmpDbPath}`;
    }
  } catch (err) {
    console.error('[Vercel Serverless] Error preparing SQLite DB in /tmp:', err);
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const app = require('../server/src/server');

module.exports = app;
