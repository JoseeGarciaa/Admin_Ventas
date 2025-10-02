import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    console.log('Connected to DB:', process.env.PGHOST, process.env.PGDATABASE);
    const { rows: funcs } = await client.query(`
      SELECT p.proname as name,
             pg_get_function_identity_arguments(p.oid) as args,
             pg_get_function_result(p.oid) as result_type
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'admin_platform'
      ORDER BY 1;
    `);
    console.log('\nFunctions in admin_platform:');
    if (funcs.length === 0) console.log('(none)');
    for (const f of funcs) {
      console.log(` - ${f.name}(${f.args}) RETURNS ${f.result_type}`);
    }

    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'admin_platform' AND table_type='BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('\nTables in admin_platform:');
    if (tables.length === 0) console.log('(none)');
    for (const t of tables) {
      console.log(' -', t.table_name);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('inspect error:', e.message);
  process.exit(1);
});
