/** Local, dependency-free export serializers. No storage, downloads or network.
 * Callers must supply an already authorized plan/appointment/list; these helpers
 * neither grant access nor export an account archive. Free-text plan notes may
 * themselves contain personal data. Calendar reimport is manual, not live sync.
 */
const text = (value) => typeof value === 'string' ? value : '';
const itemTextFields = ['name', 'meal', 'portion', 'swaps'];
const itemNumberFields = ['grams', 'k', 'p', 'c', 'f'];

export function planDocument(plan, {
  patientName = '', nutritionistName = '', generatedAt = new Date().toISOString(),
} = {}) {
  return {
    schemaVersion: 1, type: 'nutrilume-plan', generatedAt: text(generatedAt),
    patientName: text(patientName), nutritionistName: text(nutritionistName),
    plan: {
      id: text(plan?.id), created: text(plan?.created),
      note: text(plan?.note), source: text(plan?.source),
      items: (Array.isArray(plan?.items) ? plan.items : []).map((item) => {
        const result = {};
        for (const field of itemTextFields) {
          if (typeof item?.[field] === 'string') result[field] = item[field];
        }
        for (const field of itemNumberFields) {
          if (Number.isFinite(item?.[field])) result[field] = item[field];
        }
        return result;
      }),
    },
  };
}

// Require an explicit offset: a floating datetime would change meaning with
// the importing device's timezone. Reject normalized dates such as February30.
function appointmentDate(value) {
  const match = typeof value === 'string' && value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) throw new TypeError('Invalid appointment datetime; explicit timezone required');
  const [, year, month, day, hour, minute, second, zone] = match;
  const dateOnly = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (dateOnly.getUTCFullYear() !== Number(year)
    || dateOnly.getUTCMonth() + 1 !== Number(month)
    || dateOnly.getUTCDate() !== Number(day)
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
    || (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) {
    throw new TypeError('Invalid appointment datetime');
  }
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) throw new TypeError('Invalid appointment datetime');
  return result;
}

function timestamp(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())
    || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) {
    throw new TypeError('Invalid calendar timestamp');
  }
  return date.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
}

function calendarEscape(value) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// RFC5545 folding counts UTF8 octets including the continuation space. Iterate
// Unicode code points so a multi-byte character is never split between lines.
function fold(line) {
  const encoder = new TextEncoder();
  let result = '', length = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) {
      result += '\r\n ';
      length = 1;
    }
    result += character;
    length += bytes;
  }
  return result;
}

export function calendarText(appointments, { now = new Date() } = {}) {
  const stamp = timestamp(now);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nutrilume//Local Calendar Export//PT', 'CALSCALE:GREGORIAN'];
  for (const appointment of appointments) {
    if (typeof appointment.id !== 'string' || !appointment.id.trim()) {
      throw new TypeError('Calendar event requires a stable id');
    }
    const start = appointmentDate(appointment.start);
    const end = appointmentDate(appointment.end);
    if (end <= start) throw new TypeError('Invalid appointment datetime range');
    lines.push(
      'BEGIN:VEVENT', `UID:${calendarEscape(appointment.id)}@nutrilume.local`,
      `DTSTAMP:${stamp}`, `DTSTART:${timestamp(start)}`, `DTEND:${timestamp(end)}`,
      'SUMMARY:Consulta Nutrilume',
      `STATUS:${appointment.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

const plainLine = (value) => text(value).replace(/<[^>]*>/g, '')
  .replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]+/g, ' ').trim();

/** Grams are already totals for the requested period (shoppingFromPlan).
 * Manual portions remain daily descriptions; never guess a gram conversion.
 * Output is text/plain, and must not be inserted as innerHTML by the caller.
 */
export function shoppingText(items, days) {
  if (!Number.isInteger(days) || days < 1 || days > 31) {
    throw new TypeError('Período deve conter de 1 a 31 dias');
  }
  const lines = [`Lista de compras Nutrilume — período: ${days} ${days === 1 ? 'dia' : 'dias'}`, 'Gramas: totais do período. Porções manuais: conferir, sem conversão.'];
  for (const item of items) {
    const parts = [plainLine(item.name)];
    if (Number.isFinite(item.grams) && item.grams > 0) parts.push(`${item.grams} g`);
    const manual = (Array.isArray(item.manual) ? item.manual : []).map(plainLine).filter(Boolean);
    if (manual.length) parts.push(`porções manuais: ${manual.join('; ')} por dia (sem conversão)`);
    lines.push(`- ${parts.join(' · ')}`);
  }
  return lines.join('\n') + '\n';
}
