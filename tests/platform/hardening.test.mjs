import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../../server/app.mjs";
test("arquivos, tokens, persistência e revogações", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "nutrilume-hardening-")),
    database = join(dir, "db.sqlite"),
    mailbox = [];
  let current = Date.now();
  let app = await createApp({
      database,
      mail: async (m) => mailbox.push(m),
      now: () => current,
    }),
    server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  let base = `http://127.0.0.1:${server.address().port}`;
  async function req(path, body, cookie, method = body ? "POST" : "GET") {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: base,
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: r.status,
      data: (r.headers.get("content-type") || "").includes("application/json")
        ? await r.json()
        : await r.arrayBuffer(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function account(role, email) {
    await req("/auth/register", {
      role,
      name: "Teste Pessoa",
      crn: "CRN exemplo",
      email,
      password: "SenhaInicial123!",
    });
    const token = mailbox.at(-1).token;
    assert.equal((await req("/auth/verify", { token })).status, 200);
    return await req("/auth/login", { email, password: "SenhaInicial123!" });
  }
  const nut = await account("nutritionist", "n@x.com"),
    pac = await account("patient", "p@x.com"),
    stranger = await account("nutritionist", "s@x.com");
  const pid = pac.data.user.id;
  await req(
    "/profile",
    { city: "Recife", address: "Rua 1", listed: true },
    nut.cookie,
    "PUT",
  );
  await req("/link-request", { nutritionistId: nut.data.user.id }, pac.cookie);
  const link = (await req("/patients", null, nut.cookie)).data.items[0];
  await req("/links/" + link.linkId + "/accept", {}, nut.cookie);
  await req(
    `/patients/${pid}/consents`,
    { health: true, photos: true, body3d: true, group: true },
    pac.cookie,
    "PUT",
  );
  await t.test("token já consumido não funciona novamente", async () =>
    assert.equal(
      (await req("/auth/verify", { token: mailbox.at(-1).token })).status,
      400,
    ),
  );
  let photo;
  await t.test("foto privada válida pode ser enviada", async () => {
    const r = await req(
      `/patients/${pid}/files`,
      {
        kind: "photo",
        mime: "image/png",
        name: "foto.png",
        content:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
      },
      pac.cookie,
    );
    assert.equal(r.status, 201);
    photo = r.data.id;
  });
  await t.test("outro profissional não baixa foto", async () =>
    assert.equal(
      (await req("/files/" + photo, null, stranger.cookie)).status,
      403,
    ),
  );
  await t.test("foto não vai para cache", async () => {
    const r = await fetch(base + "/api/files/" + photo, {
      headers: { cookie: nut.cookie },
    });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("cache-control"), "no-store");
  });
  await t.test("revogação de fotos remove o arquivo", async () => {
    await req(
      `/patients/${pid}/consents`,
      { health: true, photos: false, body3d: false, group: false },
      pac.cookie,
      "PUT",
    );
    assert.equal((await req("/files/" + photo, null, nut.cookie)).status, 404);
  });
  await t.test("SVG disfarçado de foto é recusado", async () =>
    assert.equal(
      (
        await req(
          `/patients/${pid}/files`,
          {
            kind: "exam",
            mime: "image/png",
            name: "x.png",
            content: Buffer.from("<svg onload=alert(1)>").toString("base64"),
          },
          pac.cookie,
        )
      ).status,
      400,
    ),
  );
  await t.test(
    "senha temporária não pode ser reutilizada como definitiva",
    async () => {
      await req(
        "/patients",
        {
          name: "Nova pessoa",
          email: "nova@x.com",
          password: "Temporaria123!",
        },
        nut.cookie,
      );
      const tmp = await req("/auth/verify", { token: mailbox.at(-1).token });
      assert.equal(
        (
          await req(
            "/auth/password",
            { currentPassword: "Temporaria123!", password: "Temporaria123!" },
            tmp.cookie,
          )
        ).status,
        400,
      );
    },
  );
  await t.test("token de recuperação expira", async () => {
    await req("/auth/forgot", { email: "p@x.com" });
    const token = mailbox.at(-1).token;
    current += 1800001;
    assert.equal(
      (await req("/auth/reset", { token, password: "NovaSenhaDepois123!" }))
        .status,
      400,
    );
  });
  await t.test("paciente sem grupo pode salvar perfil sem apelido", async () =>
    assert.equal(
      (
        await req(
          "/profile",
          { name: "Novo nome", nickname: "", community: false },
          pac.cookie,
          "PUT",
        )
      ).status,
      200,
    ),
  );
  await t.test(
    "consultas canceladas não podem ser reativadas pelo paciente",
    async () => {
      const a = await req(
        "/appointments",
        {
          patientId: pid,
          start: "2030-11-10T10:00:00Z",
          minutes: 60,
          note: "Manter observação",
        },
        nut.cookie,
      );
      assert.equal(a.status, 201);
      await req(
        "/appointments/" + a.data.id,
        { status: "confirmed" },
        nut.cookie,
        "PUT",
      );
      assert.equal(
        (await req("/appointments", null, nut.cookie)).data.items[0].note,
        "Manter observação",
      );
      await req(
        "/appointments/" + a.data.id,
        { status: "cancelled" },
        pac.cookie,
        "PUT",
      );
      await req(
        "/appointments",
        { patientId: pid, start: "2030-11-10T10:00:00Z", minutes: 60 },
        nut.cookie,
      );
      assert.equal(
        (
          await req(
            "/appointments/" + a.data.id,
            { status: "confirmed" },
            pac.cookie,
            "PUT",
          )
        ).status,
        403,
      );
    },
  );
  await t.test(
    "recuperação simultânea consome token somente uma vez",
    async () => {
      await req("/auth/forgot", { email: "p@x.com" });
      const token = mailbox.at(-1).token;
      const results = await Promise.all([
        req("/auth/reset", { token, password: "RecuperadaNova123!" }),
        req("/auth/reset", { token, password: "RecuperadaNova123!" }),
      ]);
      assert.deepEqual(results.map((x) => x.status).sort(), [200, 400]);
      assert.equal((await req("/me", null, pac.cookie)).status, 401);
      const login = await req("/auth/login", {
        email: "p@x.com",
        password: "RecuperadaNova123!",
      });
      pac.cookie = login.cookie;
    },
  );
  await t.test("registros e sessão persistem após reiniciar", async () => {
    await req(
      `/patients/${pid}/messages`,
      { text: "Persistir este registro" },
      pac.cookie,
    );
    await new Promise((r) => server.close(r));
    app.close();
    app = await createApp({
      database,
      mail: async (m) => mailbox.push(m),
      now: () => current,
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${server.address().port}`;
    assert.equal(
      (await req(`/patients/${pid}/messages`, null, nut.cookie)).data.items[0]
        .text,
      "Persistir este registro",
    );
  });
  await t.test(
    "vínculo encerrado pode ser solicitado novamente sem erro interno",
    async () => {
      await req("/links/" + link.linkId + "/end", {}, pac.cookie);
      assert.equal(
        (await req(`/patients/${pid}/messages`, null, nut.cookie)).status,
        403,
      );
      assert.equal(
        (
          await req(
            "/link-request",
            { nutritionistId: nut.data.user.id },
            pac.cookie,
          )
        ).status,
        201,
      );
    },
  );
  await new Promise((r) => server.close(r));
  app.close();
  await rm(dir, { recursive: true, force: true });
});
