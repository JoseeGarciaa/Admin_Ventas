import { requireFields, isValidSchemaName, sanitize } from '../utils/validator.js';
import { listTenants, getTenantById, createTenant, updateTenantAdmin, deleteTenant } from '../models/tenantModel.js';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export async function getHome(req, res) {
  const tenants = await listTenants().catch(() => []);
  res.render('home', { title: 'Admin Ventas', tenants, flash: req.flash?.() });
}

export async function getTenants(req, res, next) {
  try {
    const tenants = await listTenants();
    res.render('tenants/list', { title: 'Tenants', tenants, flash: req.flash?.() });
  } catch (e) { next(e); }
}

export function getCreateTenant(req, res) {
  res.render('tenants/form', { title: 'Nuevo Tenant', tenant: {}, mode: 'create' });
}

export async function postCreateTenant(req, res, next) {
  try {
    const body = Object.fromEntries(Object.entries(req.body || {}).map(([k,v])=>[k, sanitize(v)]));
      const { ok, missing } = requireFields(body, ['nombre','email_contacto','password']);
    if (!ok) throw Object.assign(new Error('Faltan campos: ' + missing.join(', ')), { status: 400 });

    const tenant = await createTenant({
      nombre: body.nombre,
      nit: body.nit || null,
      email_contacto: body.email_contacto,
      telefono_contacto: body.telefono_contacto || null,
      direccion: body.direccion || null,
      password: body.password,
        esquema: undefined
    });
    req.flash?.('success', 'Tenant creado correctamente');
    res.redirect('/tenants/' + tenant.id);
  } catch (e) { next(e); }
}

export async function getTenantDetail(req, res, next) {
  try {
    const tenant = await getTenantById(req.params.id);
    if (!tenant) return res.status(404).render('404', { title: 'No encontrado' });
    res.render('tenants/detail', { title: 'Detalle Tenant', tenant });
  } catch (e) { next(e); }
}

export async function getEditTenant(req, res, next) {
  try {
    const tenant = await getTenantById(req.params.id);
    if (!tenant) return res.status(404).render('404', { title: 'No encontrado' });
    res.render('tenants/form', { title: 'Editar Tenant', tenant, mode: 'edit' });
  } catch (e) { next(e); }
}

export async function postUpdateTenant(req, res, next) {
  try {
    const body = Object.fromEntries(Object.entries(req.body || {}).map(([k,v])=>[k, sanitize(v)]));
    // For security, fetch current tenant by id and derive esquema_actual from DB
    const current = await getTenantById(body.id);
    if (!current) throw Object.assign(new Error('Tenant no encontrado'), { status: 404 });

    const nombreNuevo = body.nombre || current.nombre;
    const correoNuevo = body.email_contacto || current.email_contacto;
    const telefonoNuevo = body.telefono_contacto || current.telefono_contacto || null;
    const esquemaActual = current.esquema;
    // derive esquema_nuevo from new name
    const base = (nombreNuevo || '').toString().trim().toLowerCase()
      .normalize('NFD').replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const esquemaNuevo = `tenant_${base || 'esquema'}`;

    if (!isValidSchemaName(esquemaActual) || !isValidSchemaName(esquemaNuevo)) throw Object.assign(new Error('Esquema inválido'), { status: 400 });

    let passHash = null;
    if (body.password && body.password.trim() !== '') {
      passHash = await bcrypt.hash(body.password, 10);
    } else {
      // Reuse existing password hash from admin_platform or tenant schema to avoid NULL inserts
      passHash = current['contraseña'] || null;
      if (!passHash) {
        try {
          const q = `SELECT "PasswordHash" FROM ${esquemaActual}."Usuarios" WHERE "Correo" = $1 LIMIT 1`;
          const { rows } = await query(q, [current.email_contacto]);
          passHash = rows[0]?.PasswordHash || null;
        } catch {}
      }
      // If still not found, keep null which should be handled by DB function update branch; however
      // since insert with NULL would violate NOT NULL, we avoid proceeding without a hash
      if (!passHash) {
        throw Object.assign(new Error('Debe indicar una contraseña para este cambio'), { status: 400 });
      }
    }

    // Pre-update existing tenant user to new values in the CURRENT schema so the DB function's upsert doesn't create duplicates
    try {
      const preQ = `UPDATE ${esquemaActual}."Usuarios"
                    SET "Nombre"=$1,
                        "Correo"=$2,
                        "PasswordHash"=COALESCE($3, "PasswordHash"),
                        "Telefono"=$4
                    WHERE "Correo"=$5`;
      const preRes = await query(preQ, [
        nombreNuevo,
        correoNuevo,
        passHash,
        telefonoNuevo,
        current.email_contacto
      ]);
      // fallback: if nothing updated, try targeting the unique admin role (in case email changed previously)
      if (preRes.rowCount === 0) {
        const preQ2 = `UPDATE ${esquemaActual}."Usuarios"
                      SET "Nombre"=$1,
                          "Correo"=$2,
                          "PasswordHash"=COALESCE($3, "PasswordHash"),
                          "Telefono"=$4
                      WHERE "Rol"='admin'`;
        await query(preQ2, [nombreNuevo, correoNuevo, passHash, telefonoNuevo]);
      }
    } catch (_) { /* ignore if table not present */ }

    await updateTenantAdmin({
      esquema_actual: esquemaActual,
      esquema_nuevo: esquemaNuevo,
      nombre: nombreNuevo,
      correo: correoNuevo,
      telefono: telefonoNuevo,
      password: passHash
    });

    // Persist auxiliary fields in admin_platform.tenants
    if (body.nit !== undefined || body.direccion !== undefined) {
      await query('UPDATE admin_platform.tenants SET nit = COALESCE($1, nit), direccion = COALESCE($2, direccion) WHERE id = $3', [
        body.nit || null,
        body.direccion || null,
        current.id
      ]);
    }

    req.flash?.('success', 'Tenant actualizado');
    res.redirect(`/tenants/${current.id}`);
  } catch (e) { next(e); }
}

export async function postDeleteTenant(req, res, next) {
  try {
    const { esquema } = req.body;
    if (!isValidSchemaName(esquema)) throw Object.assign(new Error('Esquema inválido'), { status: 400 });
    await deleteTenant({ esquema });
    req.flash?.('success', 'Tenant eliminado');
    res.redirect('/tenants');
  } catch (e) { next(e); }
}
