export function notFound(req, res, next) {
  res.status(404);
  if (req.accepts('html')) return res.render('404', { title: 'No encontrado' });
  res.json({ error: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  if (req.accepts('html')) return res.status(status).render('error', { title: 'Error', message, status });
  res.status(status).json({ error: message });
}
