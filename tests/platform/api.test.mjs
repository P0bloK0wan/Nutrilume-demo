import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../../server/app.mjs";

test("contas, vínculo, dados clínicos, 3D e gestão ficam isolados", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "nutrilume-"));
  const mails = [];
  const app = await createApp({
    database: join(dir, "db.sqlite"),
    mail: async (m) => mails.push(m),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    app.close();
    await rm(dir, { recursive: true, force: true });
  });
  async function req(path, body, cookie, method = body ? "POST" : "GET") {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        Origin: base,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function account(role, email) {
    assert.equal(
      (
        await req("/auth/register", {
          role,
          name: role + " Teste",
          email,
          password: "SenhaForte123!x",
          crn: role === "nutritionist" ? "CRN-6 12345" : "",
        })
      ).status,
      201,
    );
    const token = mails.at(-1).token;
    assert.equal((await req("/auth/verify", { token })).status, 200);
    return await req("/auth/login", { email, password: "SenhaForte123!x" });
  }
  const nut = await account("nutritionist", "nut@example.com");
  const other = await account("nutritionist", "outro@example.com");
  const lone = await account("patient", "livre@example.com");
  await t.test("cadastro aceita somente os dois papéis", async () =>
    assert.equal(
      (
        await req("/auth/register", {
          role: "admin",
          name: "a",
          email: "a@b.com",
          password: "SenhaForte123!",
        })
      ).status,
      400,
    ),
  );
  await t.test("diretório somente com divulgação voluntária", async () => {
    assert.equal((await req("/directory")).data.items.length, 0);
    assert.equal(
      (
        await req(
          "/profile",
          {
            name: "Nutri Recife",
            city: "Recife",
            address: "Rua Exemplo 10",
            lat: -8.05,
            lng: -34.9,
            listed: true,
          },
          nut.cookie,
          "PUT",
        )
      ).status,
      200,
    );
    assert.equal(
      (await req("/directory?lat=-8.06&lng=-34.9")).data.items.length,
      1,
    );
  });
  const created = await req(
    "/patients",
    {
      name: "Paciente Teste",
      email: "pac@example.com",
      password: "Temporaria123!",
    },
    nut.cookie,
  );
  assert.equal(created.status, 201);
  const pid = created.data.id;
  await t.test("sem confirmação, senha temporária não abre conta", async () =>
    assert.equal(
      (
        await req("/auth/login", {
          email: "pac@example.com",
          password: "Temporaria123!",
        })
      ).status,
      403,
    ),
  );
  const activation = await req("/auth/verify", { token: mails.at(-1).token });
  const pac = { cookie: activation.cookie, data: activation.data };
  assert.equal(pac.data.user.mustChangePassword, true);
  await t.test("profissional não usa a temporária após confirmação", async () =>
    assert.equal(
      (
        await req("/auth/login", {
          email: "pac@example.com",
          password: "Temporaria123!",
        })
      ).status,
      403,
    ),
  );
  await t.test("troca obrigatória bloqueia recursos", async () =>
    assert.equal(
      (await req(`/patients/${pid}/plan`, null, pac.cookie)).status,
      403,
    ),
  );
  await req(
    "/auth/password",
    { currentPassword: "Temporaria123!", password: "PacienteNova123!" },
    pac.cookie,
  );
  await t.test("dados protegidos até aceitar consentimento", async () =>
    assert.equal(
      (await req(`/patients/${pid}/plan`, null, nut.cookie)).status,
      403,
    ),
  );
  assert.equal(
    (
      await req(
        `/patients/${pid}/consents`,
        { health: true, photos: false, body3d: true, group: false },
        pac.cookie,
        "PUT",
      )
    ).status,
    200,
  );
  const catalog = await req("/catalog");
  const plan = {
    catalogVersion: catalog.data.version,
    items: [
      { foodId: 5, name: "Frango", grams: 150, k: 239, p: 48, c: 0, f: 3.8 },
    ],
    note: "Exemplo revisado",
  };
  await t.test(
    "rascunho é persistido e privado, sem perda em formulário inválido",
    async () => {
      await req(`/patients/${pid}/plan-draft`, plan, nut.cookie, "PUT");
      assert.equal(
        (await req(`/patients/${pid}/plan-draft`, null, pac.cookie)).status,
        403,
      );
      assert.equal(
        (
          await req(
            `/patients/${pid}/plan-draft`,
            { ...plan, note: "x".repeat(2001) },
            nut.cookie,
            "PUT",
          )
        ).status,
        400,
      );
      assert.equal(
        (await req(`/patients/${pid}/plan-draft`, null, nut.cookie)).data.items
          .length,
        1,
      );
    },
  );
  await t.test("publicação tem versão e histórico", async () => {
    assert.equal(
      (await req(`/patients/${pid}/plan`, plan, nut.cookie, "PUT")).status,
      201,
    );
    assert.equal(
      (await req(`/patients/${pid}/plan`, null, pac.cookie)).data.versions
        .length,
      1,
    );
  });
  await t.test("outro profissional não acessa paciente", async () =>
    assert.equal(
      (await req(`/patients/${pid}/plan`, null, other.cookie)).status,
      403,
    ),
  );
  await t.test("paciente sem vínculo não acessa outro paciente", async () =>
    assert.equal(
      (await req(`/patients/${pid}/plan`, null, lone.cookie)).status,
      403,
    ),
  );
  await t.test("paciente não publica prescrição", async () =>
    assert.equal(
      (await req(`/patients/${pid}/plan`, plan, pac.cookie, "PUT")).status,
      403,
    ),
  );
  await t.test("avaliação e 3D exigem consentimento próprio", async () => {
    assert.equal(
      (
        await req(
          `/patients/${pid}/assessments`,
          { date: "2026-10-17", height: 170, weight: 75, waist: 85, hip: 104 },
          nut.cookie,
        )
      ).status,
      201,
    );
    assert.equal(
      (await req(`/patients/${pid}/body3d`, null, pac.cookie)).status,
      200,
    );
    await req(
      `/patients/${pid}/consents`,
      { health: true, photos: false, body3d: false, group: false },
      pac.cookie,
      "PUT",
    );
    assert.equal(
      (await req(`/patients/${pid}/body3d`, null, nut.cookie)).status,
      403,
    );
  });
  await t.test("correção mantém histórico e usa a versão atual no 3D",async()=>{await req(`/patients/${pid}/consents`,{health:true,body3d:true},pac.cookie,'PUT');const items=(await req(`/patients/${pid}/assessments`,null,nut.cookie)).data.items;const original=items[0];assert.equal((await req(`/patients/${pid}/assessments/${original.id}`,{date:'2026-10-17',height:170,weight:75,waist:84,hip:104},nut.cookie,'PUT')).status,201);const history=(await req(`/patients/${pid}/assessments`,null,pac.cookie)).data.items;assert.equal(history.length,2);assert.equal(history.find(x=>x.id===original.id).superseded,true);const body=(await req(`/patients/${pid}/body3d`,null,nut.cookie)).data.items;assert.equal(body.length,1);assert.equal(body[0].waist,84)});
  await t.test("hábitos repetidos não duplicam o dia", async () => {
    await req(
      `/patients/${pid}/habits`,
      { date: "2026-10-17", water: 1, goalDone: true },
      pac.cookie,
      "PUT",
    );
    await req(
      `/patients/${pid}/habits`,
      { date: "2026-10-17", water: 1, goalDone: true },
      pac.cookie,
      "PUT",
    );
    assert.equal(
      (await req(`/patients/${pid}/habits`, null, nut.cookie)).data.items
        .length,
      1,
    );
  });
  await t.test("mensagens são compartilhadas só no vínculo", async () => {
    await req(
      `/patients/${pid}/messages`,
      { text: "Olá <script> teste" },
      pac.cookie,
    );
    assert.equal(
      (await req(`/patients/${pid}/messages`, null, nut.cookie)).data.items
        .length,
      1,
    );
  });
  let appt;
  await t.test("agenda recusa sobreposição", async () => {
    const data = {
      patientId: pid,
      start: "2030-10-17T13:00:00.000Z",
      minutes: 60,
      mode: "online",
    };
    const a = await req("/appointments", data, nut.cookie);
    assert.equal(a.status, 201);
    appt = a.data.id;
    assert.equal(
      (
        await req(
          "/appointments",
          { ...data, start: "2030-10-17T13:30:00.000Z" },
          nut.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (await req("/appointments", null, other.cookie)).data.items.length,
      0,
    );
  });
  await t.test("reagendar não duplica lembretes", async () => {
    assert.equal(
      (
        await req(
          "/appointments/" + appt,
          { start: "2030-10-18T13:00:00.000Z", minutes: 60 },
          nut.cookie,
          "PUT",
        )
      ).status,
      200,
    );
    assert.equal(
      (await req("/reminders", null, nut.cookie)).data.items.filter(
        (x) => x.status === "pending",
      ).length,
      1,
    );
  });
  await t.test("financeiro é exclusivo do profissional", async () => {
    assert.equal(
      (
        await req(
          "/finance",
          {
            patientId: pid,
            amount: 20000,
            due: "2030-10-17",
            status: "paid",
            description: "Consulta",
          },
          nut.cookie,
        )
      ).status,
      201,
    );
    assert.equal((await req("/finance", null, nut.cookie)).data.paid, 20000);
    assert.equal((await req("/finance", null, pac.cookie)).status, 403);
  });
  await t.test("CSRF de outra origem é recusado", async () => {
    const r = await fetch(base + "/api/auth/logout", {
      method: "POST",
      headers: { Origin: "https://evil.example", cookie: pac.cookie },
    });
    assert.equal(r.status, 403);
  });
  await t.test("sessão inválida é recusada", async () =>
    assert.equal((await req("/me", null, "nl_session=invalid")).status, 401),
  );
  await t.test(
    "conta existente não é sobrescrita pelo profissional",
    async () =>
      assert.equal(
        (
          await req(
            "/patients",
            {
              name: "Duplicado",
              email: "livre@example.com",
              password: "Temporaria123!",
            },
            nut.cookie,
          )
        ).status,
        409,
      ),
  );
  await t.test("revogar saúde bloqueia leitura de dados", async () => {
    await req(
      `/patients/${pid}/consents`,
      { health: false, photos: false, body3d: false, group: false },
      pac.cookie,
      "PUT",
    );
    assert.equal(
      (await req(`/patients/${pid}/messages`, null, nut.cookie)).status,
      403,
    );
  });
});
