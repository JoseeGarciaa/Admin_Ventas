export function requireFields(obj, fields) {
  const missing = fields.filter((f) => !obj[f] && obj[f] !== false && obj[f] !== 0);
  return { ok: missing.length === 0, missing };
}

export function isValidSchemaName(name) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export function sanitize(str) {
  return String(str).trim();
}
