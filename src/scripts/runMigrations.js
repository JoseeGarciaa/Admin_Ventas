import { readFileSync } from 'fs';
import path from 'path';
import url from 'url';
import { query } from '../config/db.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function migrate() {
  const file = path.join(__dirname, '../../db/migrations/001_init_admin_platform.sql');
  const sql = readFileSync(file, 'utf8');
  await query(sql);
  console.log('Migration executed successfully.');
}
