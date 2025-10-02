#!/usr/bin/env python3
"""
Seed a temporary admin user into admin_platform.admin_users with a bcrypt-hashed password.
Usage (PowerShell):
  python scripts/seed_admin_user.py --nombre "Admin Temporal" --correo admin.temp@ventas.local --password "Admin2025!" --telefono 3000000000 --rol admin
Env overrides (optional): PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
"""
import os
import sys
import argparse
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    host = os.getenv('PGHOST', 'localhost')
    port = int(os.getenv('PGPORT', '5432'))
    db = os.getenv('PGDATABASE', 'sistemas_ventas')
    user = os.getenv('PGUSER', 'admin')
    pwd = os.getenv('PGPASSWORD', 'Ventas2025')
    return psycopg2.connect(host=host, port=port, dbname=db, user=user, password=pwd)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--nombre', required=True)
    ap.add_argument('--correo', required=True)
    ap.add_argument('--password', required=True)
    ap.add_argument('--telefono', default=None)
    ap.add_argument('--rol', default='admin', choices=['admin', 'soporte'])
    args = ap.parse_args()

    hashed = bcrypt.hashpw(args.password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

    sql = """
    INSERT INTO admin_platform.admin_users (nombre, correo, telefono, contraseña, rol, activo)
    VALUES (%s, %s, %s, %s, %s, TRUE)
    ON CONFLICT (correo) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      telefono = EXCLUDED.telefono,
      contraseña = EXCLUDED.contraseña,
      rol = EXCLUDED.rol,
      activo = TRUE,
      ultimo_ingreso = NULL
    RETURNING id, nombre, correo, rol, activo, fecha_creacion;
    """

    try:
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (args.nombre, args.correo, args.telefono, hashed, args.rol))
                row = cur.fetchone()
                print('Usuario seed OK:', dict(row))
        return 0
    except Exception as e:
        print('Error insertando usuario:', e, file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
