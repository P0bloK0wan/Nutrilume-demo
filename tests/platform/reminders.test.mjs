import { test } from "node:test";
import assert from "node:assert/strict";
import { store } from "../../server/store.mjs";
import { dispatchDueReminders } from "../../server/reminders.mjs";
test("fila respeita opt-in e não repete envios incertos", async (t) => {
  const db = store(":memory:");
  t.after(() => db.close());
  const now = Date.now();
  for (const [id, role] of [
    ["p", "patient"],
    ["n", "nutritionist"],
  ])
    db.prepare(
      "INSERT INTO users(id,role,name,email,password,verified,created,profile) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      id,
      role,
      id,
      id + "@x.com",
      "hash",
      1,
      new Date(now).toISOString(),
      JSON.stringify({ phone: "5581999990000" }),
    );
  db.prepare("INSERT INTO links VALUES(?,?,?,?,?)").run(
    "l",
    "p",
    "n",
    "active",
    JSON.stringify({ health: true, reminders: false }),
  );
  for (const [id, offset] of [
    ["a", 1],
    ["b", 2],
  ]) {
    db.prepare("INSERT INTO appointments VALUES(?,?,?,?,?,?,?)").run(
      id,
      "p",
      "n",
      new Date(now + offset * 86400000).toISOString(),
      new Date(now + offset * 86400000 + 3600000).toISOString(),
      "scheduled",
      "{}",
    );
    db.prepare("INSERT INTO reminders VALUES(?,?,?,?,?,?)").run(
      "r" + id,
      id,
      "n",
      new Date(now - 1000).toISOString(),
      "pending",
      "{}",
    );
  }
  let calls = 0;
  const send = async () => {
    calls++;
    return { id: "provider-id" };
  };
  await t.test("sem opt-in não envia", async () => {
    await dispatchDueReminders({ db, send, now });
    assert.equal(calls, 0);
  });
  db.prepare("UPDATE links SET consents=?").run(
    JSON.stringify({ health: true, reminders: true }),
  );
  await t.test("aceitação e incerteza são estados distintos", async () => {
    const results = await dispatchDueReminders({
      db,
      send: async (x) => {
        calls++;
        if (x.id === "rb") throw new Error("timeout");
        return { id: "accepted" };
      },
      now,
    });
    assert.deepEqual(results.map((x) => x.status).sort(), [
      "accepted",
      "uncertain",
    ]);
  });
  await t.test(
    "nenhum dos dois envios é repetido automaticamente",
    async () => {
      const before = calls;
      await dispatchDueReminders({ db, send, now });
      assert.equal(calls, before);
    },
  );
});
