import { loadCatalog } from "./nutrition.mjs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { store } from "./store.mjs";
import {
  token,
  digest,
  fail,
  text,
  password,
  email,
  hashPassword,
  verifyPassword,
  number,
  distance,
} from "./security.mjs";
import { careRoutes } from "./care.mjs";
import { communityRoutes } from "./community.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  name: u.name,
  email: u.email,
  verified: !!u.verified,
  mustChangePassword: !!u.must_change,
  profile: JSON.parse(u.profile),
});
export async function createApp({
  database = "data/nutrilume.sqlite",
  mail,
  production = false,
  baseURL,
  now = () => Date.now(),
} = {}) {
  const db = store(database),
    limits = new Map();
  const get = (sql, ...p) => db.prepare(sql).get(...p),
    all = (sql, ...p) => db.prepare(sql).all(...p),
    run = (sql, ...p) => db.prepare(sql).run(...p);
  const audit = (u, action, target) =>
    run(
      "INSERT INTO audits(user_id,action,target_id,created) VALUES(?,?,?,?)",
      u?.id || null,
      action,
      target || null,
      new Date(now()).toISOString(),
    );
  const safeUser = publicUser;
  const limit = (key, max = 12) => {
    const t = now();
    if (limits.size > 10000)
      for (const [k, v] of limits) if (v.end < t) limits.delete(k);
    const v = limits.get(key) || { n: 0, end: t + 900000 };
    if (v.end < t) {
      v.n = 0;
      v.end = t + 900000;
    }
    v.n++;
    limits.set(key, v);
    if (v.n > max) fail(429, "Muitas tentativas. Tente novamente mais tarde.");
  };
  const sendToken = async (u, purpose) => {
    if (!mail) fail(503, "Envio de e-mail não configurado.");
    const raw = token();
    run("DELETE FROM tokens WHERE user_id=? AND purpose=?", u.id, purpose);
    run(
      "INSERT INTO tokens VALUES(?,?,?,?)",
      digest(raw),
      u.id,
      purpose,
      now() + (purpose === "reset" ? 1800000 : 86400000),
    );
    try {
      await mail({ to: u.email, purpose, token: raw });
    } catch {
      run("DELETE FROM tokens WHERE hash=?", digest(raw));
      fail(503, "Não foi possível enviar o e-mail. Tente novamente.");
    }
  };
  const addUser = async (b, role, mustChange = 0) => {
    const name = text(b.name, 60),
      em = email(b.email),
      pw = password(b.password);
    if (!name) fail(400, "Informe o nome.");
    if (get("SELECT id FROM users WHERE email=?", em))
      fail(
        409,
        "Este e-mail já possui uma conta. Use a recuperação de acesso ou solicite um vínculo.",
      );
    const profile =
      role === "nutritionist"
        ? { crn: text(b.crn || "", 50), listed: false }
        : {};
    if (role === "nutritionist" && !profile.crn) fail(400, "Informe seu CRN.");
    const u = {
      id: token().slice(0, 22),
      role,
      name,
      email: em,
      password: await hashPassword(pw),
      must_change: mustChange,
      profile: JSON.stringify(profile),
      created: new Date(now()).toISOString(),
    };
    run(
      "INSERT INTO users(id,role,name,email,password,must_change,profile,created) VALUES(?,?,?,?,?,?,?,?)",
      u.id,
      u.role,
      u.name,
      u.email,
      u.password,
      u.must_change,
      u.profile,
      u.created,
    );
    try {
      await sendToken(u, "verify");
    } catch (e) {
      run("DELETE FROM users WHERE id=?", u.id);
      throw e;
    }
    return u;
  };
  const sessionCookie = (raw, age = 604800) =>
    `nl_session=${raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${production ? "; Secure" : ""}`;
  const ctx = { db, get, all, run, now, audit, limit, json, safeUser };
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self)",
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    );
    try {
      const url = new URL(req.url, "http://local"),
        path = url.pathname,
        method = req.method;
      if (path.startsWith("/api/")) {
        res.setHeader("Cache-Control", "no-store");
        const expectedOrigin = baseURL
          ? new URL(baseURL).origin
          : `http://${req.headers.host}`;
        if (
          !["GET", "HEAD"].includes(method) &&
          req.headers.origin !== expectedOrigin
        )
          fail(403, "Origem da solicitação inválida.");
        let b = {};
        if (!["GET", "HEAD"].includes(method)) {
          if (
            !String(req.headers["content-type"] || "").startsWith(
              "application/json",
            )
          )
            fail(415, "Use JSON.");
          let raw = "";
          for await (const chunk of req) {
            raw += chunk;
            if (Buffer.byteLength(raw) > 11500000)
              fail(413, "Arquivo ou formulário muito grande.");
          }
          try {
            b = JSON.parse(raw || "{}");
          } catch {
            fail(400, "JSON inválido.");
          }
          if (!b || Array.isArray(b) || typeof b !== "object")
            fail(400, "Formulário inválido.");
        }
        const cookie = /(?:^|;\s*)nl_session=([A-Za-z0-9_-]+)/.exec(
          req.headers.cookie || "",
        )?.[1];
        const u = cookie
          ? get(
              "SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.hash=? AND sessions.expires>?",
              digest(cookie),
              now(),
            )
          : null;
        const publicRoutes = [
          "/api/auth/register",
          "/api/auth/login",
          "/api/auth/verify",
          "/api/auth/forgot",
          "/api/auth/reset",
          "/api/directory",
          "/api/config",
        ];
        if (path === "/api/config")
          return json(res, 200, {
            mode: production ? "production" : "development",
            emailDelivery: process.env.RESEND_API_KEY ? "provider" : "local",
            email: !!mail,
            whatsapp: !!(
              process.env.WHATSAPP_TOKEN &&
              process.env.WHATSAPP_PHONE_ID &&
              process.env.WHATSAPP_TEMPLATE
            ),
          });
        if (path === "/api/auth/register" && method === "POST") {
          limit("register:" + req.socket.remoteAddress, 20);
          if (!["patient", "nutritionist"].includes(b.role))
            fail(400, "Tipo de conta inválido.");
          const user = await addUser(b, b.role);
          return json(res, 201, {
            id: user.id,
            message: "Confira seu e-mail para ativar a conta.",
          });
        }
        if (path === "/api/auth/verify" && method === "POST") {
          limit("verify:" + req.socket.remoteAddress, 40);
          const t = get(
            "SELECT * FROM tokens WHERE hash=? AND purpose='verify' AND expires>?",
            digest(text(b.token, 200)),
            now(),
          );
          if (!t) fail(400, "Link inválido ou expirado.");
          run("UPDATE users SET verified=1 WHERE id=?", t.user_id);
          run(
            "DELETE FROM tokens WHERE user_id=? AND purpose=?",
            t.user_id,
            "verify",
          );
          const activated = get("SELECT * FROM users WHERE id=?", t.user_id);
          if (activated.must_change) {
            const raw = token();
            run(
              "INSERT INTO sessions VALUES(?,?,?)",
              digest(raw),
              activated.id,
              now() + 1800000,
            );
            res.setHeader("Set-Cookie", sessionCookie(raw, 1800));
            return json(res, 200, {
              requiresPassword: true,
              user: publicUser(activated),
              message: "Defina uma senha só sua para concluir a ativação.",
            });
          }
          return json(res, 200, {
            message: "E-mail confirmado. Entre na sua conta.",
          });
        }
        if (path === "/api/auth/login" && method === "POST") {
          limit("login:" + req.socket.remoteAddress, 40);
          const em = email(b.email);
          limit("email:" + em, 15);
          const user = get("SELECT * FROM users WHERE email=?", em);
          if (!user || !(await verifyPassword(b.password, user.password)))
            fail(401, "E-mail ou senha incorretos.");
          if (!user.verified) fail(403, "Confirme seu e-mail antes de entrar.");
          if (user.must_change)
            fail(
              403,
              "Ative a conta pelo link do e-mail e troque a senha temporária. Se perdeu o link, recupere o acesso.",
            );
          if (
            get("SELECT password FROM users WHERE id=?", user.id)?.password !==
            user.password
          )
            fail(401, "Credenciais alteradas. Entre novamente.");
          const raw = token();
          run("DELETE FROM sessions WHERE expires<?", now());
          run(
            "INSERT INTO sessions VALUES(?,?,?)",
            digest(raw),
            user.id,
            now() + 604800000,
          );
          res.setHeader("Set-Cookie", sessionCookie(raw));
          audit(user, "login");
          return json(res, 200, { user: publicUser(user) });
        }
        if (path === "/api/auth/forgot" && method === "POST") {
          limit("forgot:" + req.socket.remoteAddress, 10);
          const user = get("SELECT * FROM users WHERE email=?", email(b.email));
          if (user) await sendToken(user, "reset");
          return json(res, 200, {
            message: "Se o e-mail estiver cadastrado, enviaremos instruções.",
          });
        }
        if (path === "/api/auth/reset" && method === "POST") {
          limit("reset:" + req.socket.remoteAddress, 20);
          const pw = password(b.password),
            t = get(
              "SELECT * FROM tokens WHERE hash=? AND purpose='reset' AND expires>?",
              digest(text(b.token, 200)),
              now(),
            );
          if (!t) fail(400, "Link inválido ou expirado.");
          const hash = await hashPassword(pw);
          const consumed = get(
            "DELETE FROM tokens WHERE hash=? AND purpose='reset' AND expires>? RETURNING user_id",
            digest(text(b.token, 200)),
            now(),
          );
          if (!consumed) fail(400, "Link inválido ou expirado.");
          run(
            "UPDATE users SET password=?,must_change=0,verified=1 WHERE id=?",
            hash,
            consumed.user_id,
          );
          run("DELETE FROM sessions WHERE user_id=?", t.user_id);
          run("DELETE FROM tokens WHERE user_id=?", t.user_id);
          return json(res, 200, {
            message: "Senha atualizada. Entre novamente.",
          });
        }
        if (path === "/api/catalog" && method === "GET")
          return json(res, 200, await loadCatalog());
        if (path === "/api/directory" && method === "GET") {
          const q = text(url.searchParams.get("city") || "", 100)
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase();
          const hasLoc =
            url.searchParams.has("lat") && url.searchParams.has("lng");
          const lat = hasLoc
              ? number(url.searchParams.get("lat"), -90, 90)
              : null,
            lng = hasLoc
              ? number(url.searchParams.get("lng"), -180, 180)
              : null;
          const items = all(
            "SELECT id,name,profile FROM users WHERE role='nutritionist' AND verified=1",
          )
            .map((x) => ({ id: x.id, name: x.name, ...JSON.parse(x.profile) }))
            .filter(
              (x) =>
                x.listed &&
                (!q ||
                  (x.city || "")
                    .normalize("NFD")
                    .replace(/\p{Diacritic}/gu, "")
                    .toLowerCase()
                    .includes(q)),
            )
            .map((x) => ({
              id: x.id,
              name: x.name,
              crn: x.crn,
              city: x.city,
              address: x.address,
              specialties: x.specialties,
              bio: x.bio,
              lat: x.lat,
              lng: x.lng,
              km:
                hasLoc && Number.isFinite(x.lat) && Number.isFinite(x.lng)
                  ? Math.round(distance(lat, lng, x.lat, x.lng) * 10) / 10
                  : null,
            }));
          items.sort(
            (a, b) =>
              (a.km ?? Infinity) - (b.km ?? Infinity) ||
              a.name.localeCompare(b.name),
          );
          return json(res, 200, { items: items.slice(0, 100) });
        }
        if (!u) fail(401, "Entre na sua conta.");
        if (path === "/api/me")
          return json(res, 200, {
            user: publicUser(u),
            links: all(
              "SELECT links.*,users.name AS nutritionist_name FROM links JOIN users ON users.id=links.nutritionist_id WHERE patient_id=?",
              u.id,
            ).map((x) => ({ ...x, consents: JSON.parse(x.consents) })),
          });
        if (path === "/api/auth/logout" && method === "POST") {
          if (cookie) run("DELETE FROM sessions WHERE hash=?", digest(cookie));
          res.setHeader("Set-Cookie", sessionCookie("", 0));
          return json(res, 200, { message: "Sessão encerrada." });
        }
        if (path === "/api/auth/password" && method === "POST") {
          password(b.password);
          if (b.password === b.currentPassword)
            fail(400, "Escolha uma senha diferente da atual.");
          if (!(await verifyPassword(b.currentPassword, u.password)))
            fail(403, "Senha atual incorreta.");
          const updated = run(
            "UPDATE users SET password=?,must_change=0 WHERE id=? AND password=?",
            await hashPassword(b.password),
            u.id,
            u.password,
          );
          if (!updated.changes)
            fail(409, "Sua senha já foi alterada. Entre novamente.");
          run(
            "DELETE FROM sessions WHERE user_id=? AND hash<>?",
            u.id,
            digest(cookie),
          );
          return json(res, 200, { message: "Senha atualizada." });
        }
        if (u.must_change)
          fail(403, "Troque a senha temporária para continuar.");
        if (path === "/api/profile" && method === "PUT") {
          const p = JSON.parse(u.profile);
          for (const k of [
            "city",
            "address",
            "specialties",
            "bio",
            "nickname",
            "phone",
          ])
            if (k in b) p[k] = text(b[k], k === "bio" ? 400 : 150);
          if (
            "nickname" in b &&
            p.nickname &&
            (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9-]{2,19}$/.test(p.nickname) ||
              moderateNickname(p.nickname, u.name))
          )
            fail(
              400,
              "Use um apelido de 3 a 20 caracteres sem nome real ou contato.",
            );
          if (u.role === "nutritionist") {
            if ("lat" in b)
              p.lat = b.lat === null ? null : number(b.lat, -90, 90);
            if ("lng" in b)
              p.lng = b.lng === null ? null : number(b.lng, -180, 180);
            if ("listed" in b) p.listed = b.listed === true;
            if ("publicRoom" in b) p.publicRoom = b.publicRoom === true;
            if (p.listed && (!p.city || !p.address))
              fail(400, "Informe cidade e endereço para aparecer na busca.");
          }
          if ("community" in b) p.community = b.community === true;
          const name = "name" in b ? text(b.name, 60) : u.name;
          if (!name) fail(400, "Informe o nome.");
          run(
            "UPDATE users SET name=?,profile=? WHERE id=?",
            name,
            JSON.stringify(p),
            u.id,
          );
          return json(res, 200, {
            user: publicUser(get("SELECT * FROM users WHERE id=?", u.id)),
          });
        }
        if (path === "/api/patients" && method === "POST") {
          if (u.role !== "nutritionist")
            fail(403, "Apenas nutricionistas cadastram pacientes.");
          limit("create-patient:" + u.id, 30);
          const patient = await addUser(b, "patient", 1);
          const id = token().slice(0, 22);
          run(
            "INSERT INTO links(id,patient_id,nutritionist_id,status) VALUES(?,?,?,?)",
            id,
            patient.id,
            u.id,
            "invited",
          );
          audit(u, "patient-created", patient.id);
          return json(res, 201, {
            id: patient.id,
            linkId: id,
            message:
              "Conta preparada. O paciente deve confirmar o e-mail e trocar a senha temporária.",
          });
        }
        if (path === "/api/patients" && method === "GET") {
          if (u.role !== "nutritionist")
            fail(403, "Acesso exclusivo do profissional.");
          return json(res, 200, {
            items: all(
              "SELECT users.id,users.name,users.email,links.id AS linkId,links.status,links.consents FROM links JOIN users ON users.id=links.patient_id WHERE links.nutritionist_id=? ORDER BY users.name",
              u.id,
            ).map((x) => ({ ...x, consents: JSON.parse(x.consents) })),
          });
        }
        if (path === "/api/link-request" && method === "POST") {
          if (u.role !== "patient")
            fail(403, "Apenas pacientes solicitam acompanhamento.");
          const n = get(
            "SELECT * FROM users WHERE id=? AND role='nutritionist' AND verified=1",
            text(b.nutritionistId, 100),
          );
          if (!n || !JSON.parse(n.profile).listed)
            fail(404, "Profissional indisponível.");
          if (
            get(
              "SELECT id FROM links WHERE patient_id=? AND status IN ('active','invited','requested')",
              u.id,
            )
          )
            fail(409, "Já existe um acompanhamento ou solicitação em aberto.");
          const id = token().slice(0, 22);
          run(
            "INSERT INTO links(id,patient_id,nutritionist_id,status) VALUES(?,?,?,?) ON CONFLICT(patient_id,nutritionist_id) DO UPDATE SET status='requested',consents='{}'",
            id,
            u.id,
            n.id,
            "requested",
          );
          return json(res, 201, { id });
        }
        const linkMatch = /^\/api\/links\/([^/]+)\/(accept|end)$/.exec(path);
        if (linkMatch && method === "POST") {
          const l = get("SELECT * FROM links WHERE id=?", linkMatch[1]);
          if (!l || ![l.patient_id, l.nutritionist_id].includes(u.id))
            fail(403, "Vínculo indisponível.");
          if (linkMatch[2] === "accept") {
            if (u.id !== l.nutritionist_id || l.status !== "requested")
              fail(403, "Solicitação indisponível.");
            run("UPDATE links SET status='invited' WHERE id=?", l.id);
          } else
            run(
              "UPDATE links SET status='ended',consents='{}' WHERE id=?",
              l.id,
            );
          return json(res, 200, { message: "Vínculo atualizado." });
        }
        if (path === "/api/account" && method === "DELETE") {
          if (!(await verifyPassword(b.password, u.password)))
            fail(403, "Senha incorreta.");
          audit(u, "account-deleted");
          run("DELETE FROM users WHERE id=?", u.id);
          res.setHeader("Set-Cookie", sessionCookie("", 0));
          return json(res, 200, {
            message: "Conta e dados próprios excluídos.",
          });
        }
        if (await careRoutes({ ...ctx, u, b, path, method, url, req, res }))
          return;
        if (await communityRoutes({ ...ctx, u, b, path, method, url, res }))
          return;
        fail(404, "Recurso não encontrado.");
      }
      if (!["GET", "HEAD"].includes(req.method)) fail(405, "Método inválido.");
      const pathname = path === "/" ? "/index.html" : path;
      const allowed =
        /^\/(index\.html|demo\.html|app\.js|sw\.js|manifest\.webmanifest|icon\.svg|(?:icon-192|icon-512|logo|avatar-logo|apple-touch-icon)\.png|platform\/[a-z0-9-]+\.(?:js|css|json)|foods\.json)$/;
      if (!allowed.test(pathname)) fail(404, "Arquivo não encontrado.");
      const content = await readFile(resolve(root, "." + pathname));
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(pathname)] || "application/octet-stream",
        "Cache-Control": pathname.endsWith(".html") ? "no-store" : "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (e) {
      if (!res.headersSent)
        json(res, e.status || (e.code === "ENOENT" ? 404 : 500), {
          error: e.status ? e.message : "Não foi possível concluir a operação.",
        });
      else res.end();
    }
  });
  server.close = (() => {
    const original = server.close.bind(server);
    return (cb) => {
      server.closeIdleConnections();
      return original(cb);
    };
  })();
  return {
    listen: (...args) => server.listen(...args),
    close: () => db.close(),
    db,
  };
}
function moderateNickname(n, name) {
  return (
    /\d{4,}|https?|www|\.com/i.test(n) ||
    name
      .toLowerCase()
      .split(/\s+/)
      .some((x) => x.length > 2 && n.toLowerCase().includes(x))
  );
}
