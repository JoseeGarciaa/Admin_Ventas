import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'sistemas_ventas',
  user: process.env.PGUSER || 'admin',
  password: process.env.PGPASSWORD || 'Ventas2025',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
