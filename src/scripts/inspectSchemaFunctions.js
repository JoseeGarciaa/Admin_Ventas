import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const schema = process.argv[2];
  if (!schema) {
    console.error('Uso: node src/scripts/inspectSchemaFunctions.js <schema>');
    process.exit(1);
  }
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
    console.log(`Funciones en esquema ${schema}:`);
    const { rows } = await client.query(`
      SELECT p.proname as name,
             pg_get_function_identity_arguments(p.oid) as args,
             pg_get_function_result(p.oid) as result_type
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = $1
      ORDER BY 1;
    `, [schema]);

    if (rows.length === 0) {
      console.log('(ninguna)');
    } else {
      for (const f of rows) {
        console.log(` - ${f.name}(${f.args}) RETURNS ${f.result_type}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Error inspeccionando funciones:', e.message);
  process.exit(1);
});
