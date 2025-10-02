import dotenv from 'dotenv';
dotenv.config();

import { query } from '../config/db.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      if (typeof v === 'undefined') out[k] = true; else out[k] = v;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const correo = args.correo || 'admin.temp@ventas.local';
  const { rows } = await query('DELETE FROM admin_platform.admin_users WHERE correo=$1 RETURNING id, correo', [correo]);
  if (rows.length) console.log('Usuario eliminado:', rows[0]);
  else console.log('No se encontró usuario con ese correo');
}

main().catch((e) => {
  console.error('Error delete admin:', e);
  process.exit(1);
});
