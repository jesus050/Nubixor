export function csvCell(value) {
  let normalized = value == null
    ? ''
    : value instanceof Date
      ? value.toISOString()
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  if (/^[=+\-@\t\r]/.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replaceAll('"', '""')}"`;
}
