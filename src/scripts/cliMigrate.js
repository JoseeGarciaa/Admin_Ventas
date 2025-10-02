import { migrate } from './runMigrations.js';

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
