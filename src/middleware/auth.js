export function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/auth/login');
}

export function attachUser(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  next();
}
