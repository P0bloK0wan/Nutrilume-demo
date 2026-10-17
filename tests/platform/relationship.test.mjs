import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../server/app.mjs';

test('troca de profissional isola conversa do vínculo e rascunho do autor', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'nutrilume-relationship-'));
  const mails = [];
  const app = await createApp({ database: join(dir, 'db.sqlite'), mail: async m => mails.push(m) });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    app.close();
    await rm(dir, { recursive: true, force: true });
  });
  async function req(path, body, cookie, method = body ? 'POST' : 'GET') {
    const response = await fetch(base + '/api' + path, {
      method, headers: { 'Content-Type': 'application/json', Origin: base, ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  async function professional(email, name) {
    assert.equal((await req('/auth/register', { role: 'nutritionist', name, email, password: 'SenhaForte123!x', crn: 'CRN-6 12345' })).status, 201);
    assert.equal((await req('/auth/verify', { token: mails.at(-1).token })).status, 200);
    const result = await req('/auth/login', { email, password: 'SenhaForte123!x' });
    assert.equal(result.status, 200);
    return result;
  }
  const a = await professional('nutri-a@example.test', 'Nutri Alpha');
  const b = await professional('nutri-b@example.test', 'Nutri Beta');
  assert.equal((await req('/profile', { name: 'Nutri Beta', city: 'Recife', address: 'Rua Exemplo 10', listed: true }, b.cookie, 'PUT')).status, 200);
  const created = await req('/patients', { name: 'Paciente Exemplo', email: 'patient@example.test', password: 'Temporaria123!' }, a.cookie);
  assert.equal(created.status, 201);
  const pid = created.data.id;
  const patient = await req('/auth/verify', { token: mails.at(-1).token });
  assert.equal(patient.status, 200);
  assert.equal(patient.data.user.mustChangePassword, true);
  assert.equal((await req('/auth/password', { currentPassword: 'Temporaria123!', password: 'PacienteNova123!' }, patient.cookie)).status, 200);
  const path = `/patients/${pid}`;
  assert.equal((await req(path + '/consents', { health: true }, patient.cookie, 'PUT')).status, 200);
  const catalog = await req('/catalog');
  const plan = { catalogVersion: catalog.data.version, items: [], note: 'Rascunho privado Alpha' };
  const publishedA = await req(path + '/plan', { ...plan, note: 'Histórico publicado Alpha' }, a.cookie, 'PUT');
  assert.equal(publishedA.status, 201);
  const draftA = await req(path + '/plan-draft', plan, a.cookie, 'PUT');
  assert.equal(draftA.status, 201);
  const msgA = await req(path + '/messages', { text: 'Conversa privada Alpha', linkId: 'forged' }, a.cookie);
  assert.equal(msgA.status, 201);
  const replyA = await req(path + '/messages', { text: 'Resposta para Alpha' }, patient.cookie);
  assert.equal(replyA.status, 201);
  // A legacy message has no reliable relationship attribution. Keep its row,
  // but never infer ownership from patient_id or author_id on read.
  app.db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?)').run('legacy-chat', pid, 'messages', JSON.stringify({ from: a.data.user.id, text: 'Legado sem vínculo' }), a.data.user.id, new Date().toISOString());
  await t.test('novas mensagens persistem vínculo autorizado e ignoram linkId enviado', () => {
    for (const id of [msgA.data.id, replyA.data.id]) {
      const row = app.db.prepare('SELECT data FROM records WHERE id=?').get(id);
      assert.equal(JSON.parse(row.data).linkId, created.data.linkId);
    }
  });
  await t.test('chat ativo exibe a conversa atual e não atribui mensagens legadas', async () => {
    for (const account of [a, patient]) {
      const result = await req(path + '/messages', null, account.cookie);
      assert.equal(result.status, 200);
      assert.deepEqual(new Set(result.data.items.map(x => x.id)), new Set([msgA.data.id, replyA.data.id]));
    }
  });
  assert.equal((await req(`/links/${created.data.linkId}/end`, {}, patient.cookie)).status, 200);
  const requestB = await req('/link-request', { nutritionistId: b.data.user.id }, patient.cookie);
  assert.equal(requestB.status, 201);
  assert.equal((await req(`/links/${requestB.data.id}/accept`, {}, b.cookie)).status, 200);
  assert.equal((await req(path + '/consents', { health: true }, patient.cookie, 'PUT')).status, 200);
  await t.test('novo profissional e paciente não veem conversa encerrada', async () => {
    for (const account of [b, patient]) {
      const result = await req(path + '/messages', null, account.cookie);
      assert.equal(result.status, 200);
      assert.deepEqual(result.data.items, []);
    }
  });
  await t.test('novo chat pertence ao vínculo Beta e é visível aos participantes', async () => {
    const message = await req(path + '/messages', { text: 'Conversa atual Beta', linkId: created.data.linkId }, b.cookie);
    assert.equal(message.status, 201);
    const reply = await req(path + '/messages', { text: 'Resposta atual Beta' }, patient.cookie);
    assert.equal(reply.status, 201);
    for (const account of [b, patient]) {
      const result = await req(path + '/messages', null, account.cookie);
      assert.deepEqual(new Set(result.data.items.map(x => x.id)), new Set([message.data.id, reply.data.id]));
      assert.ok(result.data.items.every(x => x.linkId === requestB.data.id));
    }
  });
  await t.test('rascunho anterior não aparece para Beta', async () => {
    const result = await req(path + '/plan-draft', null, b.cookie);
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.items, []);
  });
  await t.test('histórico publicado autorizado continua disponível', async () => {
    const result = await req(path + '/plan', null, b.cookie);
    assert.equal(result.status, 200);
    assert.equal(result.data.current.id, publishedA.data.id);
    assert.equal(result.data.current.note, 'Histórico publicado Alpha');
  });
  await t.test('salvar e publicar Beta preserva rascunho Alpha', async () => {
    const assertDraftA = () => {
      const row = app.db.prepare('SELECT author_id,data FROM records WHERE id=?').get(draftA.data.id);
      assert.ok(row, 'Rascunho Alpha deve permanecer no banco');
      assert.equal(row.author_id, a.data.user.id);
      assert.equal(JSON.parse(row.data).note, plan.note);
    };
    assert.equal((await req(path + '/plan-draft', { ...plan, note: 'Rascunho Beta' }, b.cookie, 'PUT')).status, 201);
    assertDraftA();
    const ownDrafts = await req(path + '/plan-draft', null, b.cookie);
    assert.equal(ownDrafts.data.items.length, 1);
    assert.equal(ownDrafts.data.items[0].authorId, b.data.user.id);
    assert.equal((await req(path + '/plan', { ...plan, note: 'Publicado Beta' }, b.cookie, 'PUT')).status, 201);
    assertDraftA();
    assert.deepEqual((await req(path + '/plan-draft', null, b.cookie)).data.items, []);
    assert.equal((await req(path + '/plan', null, patient.cookie)).data.current.note, 'Publicado Beta');
  });
  await t.test('profissional encerrado recebe403 e registros anteriores permanecem', async () => {
    for (const resource of ['messages', 'plan-draft']) {
      assert.equal((await req(path + '/' + resource, null, a.cookie)).status, 403);
    }
    assert.equal((await req(path + '/messages', { text: 'Acesso antigo' }, a.cookie)).status, 403);
    for (const id of [msgA.data.id, replyA.data.id, 'legacy-chat']) {
      assert.ok(app.db.prepare('SELECT id FROM records WHERE id=?').get(id));
    }
  });
});
