import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../server/app.mjs";
test("comunidade preserva separação de sala e apelido", async (t) => {
  let current = Date.now();
  const mails = [],
    app = await createApp({
      now: () => current,
      database: ":memory:",
      mail: async (x) => mails.push(x),
    }),
    server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    app.close();
  });
  async function req(path, body, cookie, method = body ? "POST" : "GET") {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        Origin: base,
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function acc(role, email) {
    await req("/auth/register", {
      role,
      email,
      name: "Nome Real",
      password: "SenhaSegura123!",
      crn: "CRN exemplo",
    });
    await req("/auth/verify", { token: mails.at(-1).token });
    return await req("/auth/login", { email, password: "SenhaSegura123!" });
  }
  const n = await acc("nutritionist", "n@a.com"),
    other = await acc("nutritionist", "o@a.com"),
    p = await acc("patient", "p@a.com");
  await req("/profile", { publicRoom: true }, n.cookie, "PUT");
  await req(
    "/profile",
    { nickname: "Folha-Azul", community: true },
    p.cookie,
    "PUT",
  );
  const room = n.data.user.id;
  assert.equal(
    (await req("/community/rooms", null, p.cookie)).data.items.length,
    1,
  );
  assert.equal(
    (
      await req(
        "/community/rooms/" + room + "/posts",
        { text: "Gostei da receita" },
        p.cookie,
      )
    ).status,
    201,
  );
  const posts = await req(
    "/community/rooms/" + room + "/posts",
    null,
    n.cookie,
  );
  assert.equal(posts.data.items[0].nickname, "Folha-Azul");
  assert.equal("author_id" in posts.data.items[0], false);
  assert.equal(
    (await req("/community/rooms/" + room + "/alerts", null, other.cookie))
      .status,
    403,
  );
  current += 4000;
  await req(
    "/community/rooms/" + room + "/posts",
    { text: "me odeio e quero passar fome" },
    p.cookie,
  );
  assert.equal(
    (await req("/community/rooms/" + room + "/alerts", null, n.cookie)).data
      .items.length,
    1,
  );
  assert.equal(
    (await req("/rooms/" + room + "/alerts", null, n.cookie)).data.items.length,
    0,
  );
});
