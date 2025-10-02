import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

export function getLogin(req, res) {
  res.render('auth/login', { title: 'Iniciar sesión' });
}

export async function postLogin(req, res) {
  const { correo, password } = req.body;
  if (!correo || !password) return res.status(400).render('auth/login', { title: 'Iniciar sesión', error: 'Correo y contraseña son requeridos' });
  try {
    const { rows } = await query('SELECT id, nombre, correo, telefono, contraseña, rol, activo FROM admin_platform.admin_users WHERE correo=$1 LIMIT 1', [correo]);
    const user = rows[0];
    if (!user) return res.status(401).render('auth/login', { title: 'Iniciar sesión', error: 'Credenciales inválidas' });

    const isHash = user.contraseña && user.contraseña.startsWith('$2');
    const ok = isHash ? await bcrypt.compare(password, user.contraseña) : (user.contraseña === password);
    if (!ok) return res.status(401).render('auth/login', { title: 'Iniciar sesión', error: 'Credenciales inválidas' });
    if (user.activo === false) return res.status(403).render('auth/login', { title: 'Iniciar sesión', error: 'Usuario inactivo' });

    req.session.user = { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol };
    await query('UPDATE admin_platform.admin_users SET ultimo_ingreso = CURRENT_TIMESTAMP WHERE id=$1', [user.id]);
    res.redirect('/');
  } catch (e) {
    console.error(e);
    res.status(500).render('auth/login', { title: 'Iniciar sesión', error: 'Error interno' });
  }
}

export function postLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}
