import { execSync } from 'node:child_process';
import path from 'path';

export function migrateTestDb() {
  // Use prisma migrate deploy against the test DATABASE_URL
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.resolve(process.cwd()),
    env: process.env,
  });
}

export function resetTestDb() {
  // For SQLite, easiest is to reset via migrate reset with force + skip-seed
  execSync('npx prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    cwd: path.resolve(process.cwd()),
    env: process.env,
  });
}
