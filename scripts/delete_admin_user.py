#!/usr/bin/env python3
"""
Delete a temporary admin user by email from admin_platform.admin_users.
Usage (PowerShell):
  python scripts/delete_admin_user.py --correo admin.temp@ventas.local
Env overrides (optional): PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
"""
import os
import sys
import argparse
import psycopg2


def get_conn():
    host = os.getenv('PGHOST', 'localhost')
    port = int(os.getenv('PGPORT', '5432'))
    db = os.getenv('PGDATABASE', 'sistemas_ventas')
    user = os.getenv('PGUSER', 'admin')
    pwd = os.getenv('PGPASSWORD', 'Ventas2025')
    return psycopg2.connect(host=host, port=port, dbname=db, user=user, password=pwd)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--correo', required=True)
    args = ap.parse_args()
    sql = 'DELETE FROM admin_platform.admin_users WHERE correo = %s RETURNING id, correo;'

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (args.correo,))
                row = cur.fetchone()
                if row:
                    print('Usuario eliminado:', row)
                else:
                    print('No se encontró usuario con ese correo')
        return 0
    except Exception as e:
        print('Error eliminando usuario:', e, file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
