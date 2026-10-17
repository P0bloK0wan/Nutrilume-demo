import test from 'node:test';
import assert from 'node:assert/strict';
import { planDocument, calendarText, shoppingText } from '../../platform/exports.js';

const now = new Date('2026-10-17T10:00:00Z');
const appointment = { id: 'appointment-1', start: '2026-10-20T14:30:00-03:00', end: '2026-10-20T15:30:00-03:00', status: 'scheduled' };
const unfold = (text) => text.replace(/\r\n /g, '');

test('plan export retains only the documented fields, including inside items', () => {
  const plan = { id: 'plan-2', created: '2026-10-17', note: 'Plano revisado', source: 'Catálogo local', patientId: 'secret-patient-id', email: 'secret@example.test', items: [{ name: 'Arroz', meal: 'Almoço', portion: '100 g', swaps: 'Batata', grams: 100, k: 120, p: 2, c: 25, f: 1, foodId: 'internal', password: 'secret-password' }] };
  const result = planDocument(plan, { patientName: 'Paciente fictício', nutritionistName: 'Profissional fictício', generatedAt: now.toISOString() });
  assert.deepEqual(result, { schemaVersion: 1, type: 'nutrilume-plan', generatedAt: now.toISOString(), patientName: 'Paciente fictício', nutritionistName: 'Profissional fictício', plan: { id: plan.id, created: plan.created, note: plan.note, source: plan.source, items: [{ name: 'Arroz', meal: 'Almoço', portion: '100 g', swaps: 'Batata', grams: 100, k: 120, p: 2, c: 25, f: 1 }] } });
  assert.equal(JSON.stringify(result).includes('secret'), false);
  result.plan.items[0].name = 'Outro';
  assert.equal(plan.items[0].name, 'Arroz');
});

test('plan allowlist does not preserve nested objects hidden in permitted fields', () => {
  const result = planDocument({ note: { password: 'secret' }, items: [{ name: { email: 'secret' }, swaps: { phone: 'secret' }, k: Infinity }] });
  assert.equal(JSON.stringify(result).includes('secret'), false);
  assert.equal(result.patientName, '');
  assert.equal(result.nutritionistName, '');
  assert.ok(Number.isFinite(Date.parse(result.generatedAt)));
});

test('calendar converts timezone offsets to UTC and keeps content generic', () => {
  const value = calendarText([{ ...appointment, patientName: 'SecretName', email: 'secret@example.test', phone: '123456', notes: 'SecretNote' }], { now });
  assert.match(value, /DTSTART:20261020T173000Z\r\nDTEND:20261020T183000Z/);
  assert.match(value, /DTSTAMP:20261017T100000Z/);
  assert.match(value, /SUMMARY:Consulta Nutrilume/);
  assert.match(value, /STATUS:CONFIRMED/);
  assert.match(value, /UID:appointment-1@nutrilume.local/);
  assert.doesNotMatch(value, /Secret|secret|123456|ATTENDEE|DESCRIPTION/);
  assert.equal(value.replace(/\r\n/g, '').includes('\n'), false);
  assert.ok(value.endsWith('END:VCALENDAR\r\n'));
});

test('cancelled events keep their UID for manual reimport without claiming sync', () => {
  const first = unfold(calendarText([appointment], { now }));
  const cancelled = unfold(calendarText([{ ...appointment, status: 'cancelled' }], { now: new Date('2026-10-18T10:00:00Z') }));
  assert.equal(first.match(/UID:([^\r]+)/)[1], cancelled.match(/UID:([^\r]+)/)[1]);
  assert.match(cancelled, /STATUS:CANCELLED/);
  assert.match(cancelled, /BEGIN:VEVENT/);
});

test('calendar rejects invalid, normalized, ambiguous and reversed datetimes', () => {
  for (const start of ['not-a-date', '2026-02-30T10:00:00Z', '2026-10-20T14:30:00', '2026-13-01T00:00:00Z']) {
    assert.throws(() => calendarText([{ ...appointment, start }], { now }), /date|data|time/i);
  }
  assert.throws(() => calendarText([{ ...appointment, end: '2026-10-19T00:00:00Z' }], { now }), /date|data|time/i);
  assert.throws(() => calendarText([appointment], { now: new Date(NaN) }), /date|data|time/i);
});

test('calendar escapes CRLF injection in IDs rather than creating properties', () => {
  const text = unfold(calendarText([{ ...appointment, id: 'abc\r\nATTENDEE:evil@example.test;,\\' }], { now }));
  assert.equal(text.split('\r\n').filter(line => line.startsWith('ATTENDEE:')).length, 0);
  assert.equal(text.match(/BEGIN:VEVENT/g).length, 1);
  assert.match(text, /UID:abc\\nATTENDEE:evil@example\.test\\;\\,\\\\@nutrilume.local/);
});

test('calendar folds Unicode at 75 UTF8 octets and unfolds losslessly', () => {
  const id = 'consulta-💚-ação'.repeat(18);
  const value = calendarText([{ ...appointment, id }], { now });
  for (const line of value.split('\r\n')) {
    assert.ok(Buffer.byteLength(line, 'utf8') <= 75, line);
    assert.doesNotMatch(line, /\uFFFD/);
  }
  assert.ok(value.includes('\r\n '));
  assert.ok(unfold(value).includes(`UID:${id}@nutrilume.local`));
});

test('shopping export preserves period totals and labels manual portions without conversion', () => {
  const value = shoppingText([{ name: 'Arroz', grams: 725.5 }, { name: 'Banana', grams: 0, manual: ['1 unidade', '½ unidade'] }, { name: 'Aveia', grams: 50, manual: ['1 colher'] }], 7);
  assert.match(value, /7 dias/);
  assert.match(value, /Arroz.*725[.,]5 g/);
  assert.doesNotMatch(value, /5078/);
  assert.match(value, /Banana.*1 unidade.*½ unidade/);
  assert.match(value, /manual|manuais/);
  assert.match(value, /por dia/);
  assert.match(value, /Aveia.*50 g.*1 colher/);
  assert.throws(() => shoppingText([], 0), /período|dias|days/i);
});

test('shopping is plain text without HTML or injected list lines', () => {
  const value = shoppingText([{ name: '<b>Arroz</b>\r\n- item falso', grams: 100, manual: ['<img src=x>colher\nextra'] }], 1);
  assert.doesNotMatch(value, /<[^>]*>/);
  assert.equal(value.split('\n').filter(line => line.startsWith('- ')).length, 1);
  assert.match(value, /Arroz/);
});
