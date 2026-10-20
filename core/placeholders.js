// Marcadores en plantillas: {{nombre}}, {{primer_nombre}}, {{edad}}, {{hoy}}.
// Los datos del paciente se leen de la ficha en uso y viven solo en memoria:
// nunca se guardan en la base.
export const VARIABLES = ['nombre', 'primer_nombre', 'edad', 'hoy'];

const ACCENTS = { a: 'aáàäâ', e: 'eéèëê', i: 'iíìïî', o: 'oóòöô', u: 'uúùüû', n: 'nñ' };
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripAccents = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');
const toTitle = (s) => s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sp, c) => sp + c.toUpperCase());

// Regex de un nombre que ignora mayúsculas y tildes.
const tokenRe = (token) =>
  [...stripAccents(token).toLowerCase()].map((c) => (ACCENTS[c] ? `[${ACCENTS[c]}]` : escapeRe(c))).join('');

export function normalizePatient(raw) {
  if (!raw?.nombre) return null;
  const nombre = toTitle(raw.nombre.trim().replace(/\s+/g, ' '));
  return { nombre, primer_nombre: nombre.split(' ')[0], edad: raw.edad ? String(raw.edad) : '' };
}

// Reemplaza el nombre del paciente (y su edad) por marcadores. Devuelve el texto y cuántos reemplazos hizo.
export function anonymize(text, rawPatient) {
  const patient = normalizePatient(rawPatient);
  if (!patient) return { text, count: 0 };

  let count = 0;
  const tokens = patient.nombre.split(' ').filter((t) => t.length >= 3);
  if (tokens.length) {
    const alt = tokens.map(tokenRe).join('|');
    const run = new RegExp(`(?<!\\p{L})(?:${alt})(?:\\s+(?:${alt}))*(?!\\p{L})`, 'giu');
    const first = new RegExp(`^${tokenRe(tokens[0])}$`, 'iu');
    text = text.replace(run, (match) => {
      count++;
      return match.trim().split(/\s+/).length === 1 && first.test(match) ? '{{primer_nombre}}' : '{{nombre}}';
    });
  }
  if (patient.edad) {
    text = text.replace(new RegExp(`(?<!\\d)${escapeRe(patient.edad)}(\\s+años)`, 'gi'), () => {
      count++;
      return '{{edad}} años';
    });
  }
  return { text, count };
}

// Sustituye los marcadores con los datos de la ficha. `missing` lista los que no se pudieron resolver.
export function applyVars(text, rawPatient) {
  const p = normalizePatient(rawPatient);
  const values = { ...(p ?? {}), hoy: new Date().toLocaleDateString('es-CL') };
  const missing = new Set();
  const out = text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (values[key]) return values[key];
    if (VARIABLES.includes(key)) missing.add(key);
    return match;
  });
  return { text: out, missing: [...missing] };
}
