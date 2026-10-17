import { token, text, fail, moderate } from "./security.mjs";
export async function communityRoutes(c) {
  const { u, b, path, method, res, json, all, get, run, now } = c;
  if (path === "/api/rooms" && method === "GET") {
    const own =
      u.role === "nutritionist"
        ? [{ id: u.id, name: "Sala de " + u.name }]
        : all(
            "SELECT users.id,users.name FROM users JOIN links ON users.id=links.nutritionist_id WHERE patient_id=? AND status='active'",
            u.id,
          ).map((x) => ({ id: x.id, name: "Sala de " + x.name }));
    json(res, 200, { items: own });
    return true;
  }
  if (path === "/api/community/rooms" && method === "GET") {
    if (u.role === "patient" && !JSON.parse(u.profile).community)
      fail(403, "Aceite as regras da comunidade no perfil.");
    const items = all(
      "SELECT id,name,profile FROM users WHERE role='nutritionist' AND verified=1",
    )
      .filter(
        (x) =>
          JSON.parse(x.profile).publicRoom &&
          (u.role === "patient" || x.id === u.id),
      )
      .map((x) => ({ id: x.id, name: "Sala de " + x.name }));
    json(res, 200, { items });
    return true;
  }
  const publicRoom = path.startsWith("/api/community/");
  const route = publicRoom ? path.replace("/api/community/", "/api/") : path;
  const match = /^\/api\/rooms\/([^/]+)\/(posts|alerts)(?:\/([^/]+))?$/.exec(
    route,
  );
  if (!match) return false;
  const [, hostId, kind, id] = match;
  const room = publicRoom ? "public:" + hostId : hostId;
  const host = get(
    "SELECT id,profile FROM users WHERE id=? AND role='nutritionist'",
    hostId,
  );
  if (!host) fail(404, "Sala inexistente.");
  if (publicRoom && !JSON.parse(host.profile).publicRoom)
    fail(403, "Sala indisponível.");
  if (u.role === "nutritionist" && u.id !== hostId)
    fail(403, "Você não modera esta sala.");
  if (u.role === "patient" && publicRoom && !JSON.parse(u.profile).community)
    fail(403, "Aceite as regras no perfil.");
  if (u.role === "patient" && !publicRoom) {
    const l = get(
      "SELECT consents FROM links WHERE patient_id=? AND nutritionist_id=? AND status='active'",
      u.id,
      room,
    );
    if (!l || !JSON.parse(l.consents).group || !JSON.parse(l.consents).health)
      fail(403, "Autorize sua participação no grupo.");
  }
  if (kind === "alerts") {
    if (u.id !== hostId) fail(403, "Somente a anfitriã vê alertas.");
    json(res, 200, {
      items: all(
        "SELECT * FROM alerts WHERE room=? ORDER BY created DESC",
        room,
      ),
    });
    return true;
  }
  if (method === "GET") {
    json(res, 200, {
      items: all(
        `SELECT id,author_id,nickname,text,hidden,reported,created FROM posts WHERE room=? ${u.id === hostId ? "" : "AND hidden=0"} AND author_id NOT IN (SELECT blocked_id FROM blocks WHERE user_id=?) ORDER BY created`,
        room,
        u.id,
      ).map(({ author_id, ...x }) => ({
        ...x,
        mine: author_id === u.id,
        nutritionist: author_id === hostId,
      })),
    });
    return true;
  }
  if (method === "POST" && !id) {
    const p = JSON.parse(u.profile);
    if (u.role === "patient" && (!p.nickname || !p.community))
      fail(403, "Defina um apelido e aceite as regras no perfil.");
    const value = text(b.text, 280);
    if (!value) fail(400, "Mensagem vazia.");
    const last = get(
      "SELECT created FROM posts WHERE author_id=? ORDER BY created DESC LIMIT 1",
      u.id,
    );
    if (last && now() - new Date(last.created).getTime() < 3000)
      fail(429, "Aguarde alguns segundos antes de publicar novamente.");
    const result = moderate(value);
    if (result === "care") {
      run(
        "INSERT INTO alerts VALUES(?,?,?)",
        token().slice(0, 22),
        room,
        new Date(now()).toISOString(),
      );
      json(res, 422, {
        error:
          "Sua mensagem não foi publicada. Fale com seu nutricionista em particular. Se precisar conversar agora, o CVV atende pelo 188.",
      });
      return true;
    }
    if (result)
      fail(400, "Evite pesos, links, doses e recomendações clínicas no grupo.");
    const postId = token().slice(0, 22);
    run(
      "INSERT INTO posts(id,room,author_id,nickname,text,created) VALUES(?,?,?,?,?,?)",
      postId,
      room,
      u.id,
      u.role === "nutritionist" ? u.name : p.nickname,
      value,
      new Date(now()).toISOString(),
    );
    json(res, 201, { id: postId });
    return true;
  }
  if (id) {
    const post = get("SELECT * FROM posts WHERE id=? AND room=?", id, room);
    if (!post) fail(404, "Mensagem indisponível.");
    if (method === "DELETE") {
      if (u.id !== post.author_id)
        fail(403, "Você só pode apagar sua mensagem.");
      run("DELETE FROM posts WHERE id=?", id);
    } else if (method === "PUT") {
      if (b.action === "hide") {
        if (u.id !== hostId) fail(403, "Apenas a anfitriã pode moderar.");
        run(
          "UPDATE posts SET hidden=? WHERE id=?",
          b.hidden === false ? 0 : 1,
          id,
        );
      } else if (b.action === "report") {
        if (post.author_id === u.id)
          fail(400, "Você não pode denunciar sua própria mensagem.");
        run("UPDATE posts SET reported=1 WHERE id=?", id);
      } else if (b.action === "block") {
        if (post.author_id === hostId)
          fail(400, "A anfitriã não pode ser bloqueada.");
        run("INSERT OR IGNORE INTO blocks VALUES(?,?)", u.id, post.author_id);
      } else fail(400, "Ação inválida.");
    } else return false;
    json(res, 200, { message: "Mensagem atualizada." });
    return true;
  }
  return false;
}
