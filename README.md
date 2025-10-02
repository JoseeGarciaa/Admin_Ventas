# Admin Ventas (Multi-tenant MVC)

Aplicación Node.js + Express (MVC) con PostgreSQL para administrar tenants (clientes) mediante esquemas. Al crear un nuevo tenant se clona el esquema `tenant_base` y se inserta un usuario admin. UI moderna con Tailwind + daisyUI.

## Requisitos
- Node.js 18+
- PostgreSQL 13+

## Configuración
1. Copia `.env.example` a `.env` y ajusta si es necesario. Por defecto usa:
   - PGHOST=localhost
   - PGPORT=5432
   - PGDATABASE=sistemas_ventas
   - PGUSER=admin
   - PGPASSWORD=Ventas2025

2. Instala dependencias.

```powershell
npm install
```

3. Ejecuta migraciones (también se ejecutan al levantar el server por primera vez):
  - Opción A (recomendada): ejecuta manualmente
  ```powershell
  npm run migrate
  ```
  - Opción B: activar al iniciar el server (no recomendado en producción)
  Configura `MIGRATE_ON_START=true` en `.env` y arranca.

4. Levanta el servidor en desarrollo:

```powershell
npm run dev
```

Servidor: http://localhost:3000

## Uso rápido
- Home: listado rápido de tenants y acceso a crear uno nuevo.
- Tenants:
  - Crear: formulario en `/tenants/new` (campos: nombre, email_contacto, esquema, password, etc.)
  - Ver detalle: `/tenants/:id`
  - Actualizar admin/renombrar esquema: POST `/tenants/update`
  - Eliminar tenant (borra esquema y registro): POST `/tenants/delete`

## Notas
- El SQL de migración crea el schema `admin_platform`, las tablas `admin_users` y `tenants`, y las funciones `crear_tenant`, `actualizar_tenant`, `eliminar_tenant`.
- Se asume que existe un esquema `tenant_base` con la estructura a copiar. Si faltan tablas/secuencias mencionadas en la función, ajusta los nombres o coméntalas.
- Si usas SSL para PG, define `PGSSL=true` en `.env`.
