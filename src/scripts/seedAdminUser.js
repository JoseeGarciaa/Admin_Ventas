import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
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
  const nombre = args.nombre || 'Admin Temporal';
  const correo = args.correo || 'admin.temp@ventas.local';
  const telefono = args.telefono || null;
  const rol = args.rol || 'admin';
  const password = args.password || 'Admin2025!';
  const codigo = args.codigo || 'ADM-TEMP-0001';

  const hash = await bcrypt.hash(password, 10);
  // Detect if column 'codigo' exists
  const colCheck = await query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='admin_platform' AND table_name='admin_users' AND column_name='codigo'
  `);
  let rows;
  if (colCheck.rowCount > 0) {
    const sql = `
      INSERT INTO admin_platform.admin_users (codigo, nombre, correo, telefono, contraseña, rol, activo)
      VALUES ($1,$2,$3,$4,$5,$6, TRUE)
      ON CONFLICT (correo) DO UPDATE SET
        codigo = EXCLUDED.codigo,
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        contraseña = EXCLUDED.contraseña,
        rol = EXCLUDED.rol,
        activo = TRUE,
        ultimo_ingreso = NULL
      RETURNING id, codigo, nombre, correo, rol, activo, fecha_creacion;
    `;
    ({ rows } = await query(sql, [codigo, nombre, correo, telefono, hash, rol]));
  } else {
    const sql = `
      INSERT INTO admin_platform.admin_users (nombre, correo, telefono, contraseña, rol, activo)
      VALUES ($1,$2,$3,$4,$5, TRUE)
      ON CONFLICT (correo) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        contraseña = EXCLUDED.contraseña,
        rol = EXCLUDED.rol,
        activo = TRUE,
        ultimo_ingreso = NULL
      RETURNING id, nombre, correo, rol, activo, fecha_creacion;
    `;
    ({ rows } = await query(sql, [nombre, correo, telefono, hash, rol]));
  }
  console.log('Usuario seed OK:', rows[0]);
}

main().catch((e) => {
  console.error('Error seed admin:', e);
  process.exit(1);
});
