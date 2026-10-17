import {
  loadCatalog,
  calculateItems,
  recipeNutrition,
  shoppingFromPlan,
} from "./nutrition.mjs";
import { token, fail, text, number, date } from "./security.mjs";
import { readFile } from "node:fs/promises";
const stamp = (now) => new Date(now()).toISOString();
export function authorize(c, pid, { health = true, permission } = {}) {
  const { u, get } = c;
  const patient = get(
    "SELECT id,name,email,profile FROM users WHERE id=? AND role='patient'",
    pid,
  );
  if (!patient) fail(404, "Paciente não encontrado.");
  let link;
  if (u.role === "patient") {
    if (u.id !== pid) fail(403, "Acesso negado.");
    link = get(
      "SELECT * FROM links WHERE patient_id=? AND status IN ('active','invited') ORDER BY status LIMIT 1",
      pid,
    );
  } else {
    link = get(
      "SELECT * FROM links WHERE patient_id=? AND nutritionist_id=? AND status IN ('active','invited')",
      pid,
      u.id,
    );
    if (!link) fail(403, "Este paciente não está vinculado a você.");
  }
  const consents = link ? JSON.parse(link.consents) : {};
  if (health && (!link || link.status !== "active" || !consents.health))
    fail(403, "O paciente precisa autorizar o acompanhamento.");
  if (permission && !consents[permission])
    fail(403, "O paciente não autorizou este recurso.");
  return { patient, link, consents };
}
export async function careRoutes(c) {
  const { u, b, path, method, url, res, req, get, all, run, json, audit, now } =
    c;
  const match = /^\/api\/patients\/([^/]+)\/([a-z0-9-]+)(?:\/([^/]+))?$/.exec(
    path,
  );
  if (match) {
    const [, pid, kind, itemId] = match;
    const access = authorize(c, pid, {
      health: kind !== "consents",
      permission: kind === "body3d" ? "body3d" : undefined,
    });
    if (kind === "consents") {
      if (method === "GET") {
        json(res, 200, {
          consents: access.consents,
          link: access.link
            ? {
                id: access.link.id,
                status: access.link.status,
                nutritionistName: get(
                  "SELECT name FROM users WHERE id=?",
                  access.link.nutritionist_id,
                ).name,
              }
            : null,
        });
        return true;
      }
      if (method === "PUT") {
        if (u.id !== pid) fail(403, "Somente o paciente pode consentir.");
        if (!access.link) fail(409, "Não há vínculo para autorizar.");
        const health = b.health === true;
        const consents = {
          health,
          photos: health && b.photos === true,
          body3d: health && b.body3d === true,
          group: health && b.group === true,
          reminders: health && b.reminders === true,
          version: "2026-10-17",
          updated: stamp(now),
        };
        run(
          "UPDATE links SET consents=?,status='active' WHERE id=?",
          JSON.stringify(consents),
          access.link.id,
        );
        if (!consents.photos)
          run("DELETE FROM files WHERE patient_id=? AND kind='photo'", pid);
        audit(u, "consents-updated", pid);
        json(res, 200, { consents });
        return true;
      }
    }
    if (kind === "profile" && method === "GET") {
      json(res, 200, {
        patient: {
          id: pid,
          name: access.patient.name,
          profile: JSON.parse(access.patient.profile),
        },
      });
      return true;
    }
    const records = () =>
      all(
        "SELECT * FROM records WHERE patient_id=? AND kind=? ORDER BY created DESC,rowid DESC",
        pid,
        kind,
      ).map((x) => ({
        id: x.id,
        created: x.created,
        authorId: x.author_id,
        ...JSON.parse(x.data),
      }));
    const save = (data) => {
      const id = token().slice(0, 22);
      run(
        "INSERT INTO records VALUES(?,?,?,?,?,?)",
        id,
        pid,
        kind,
        JSON.stringify(data),
        u.id,
        stamp(now),
      );
      audit(u, "write-" + kind, pid);
      return id;
    };
    if (kind === "body3d" && method === "GET") {
      audit(u, "read-body3d", pid);
      json(res, 200, {
        estimated: true,
        items: (()=>{const entries=all("SELECT id,data FROM records WHERE patient_id=? AND kind='assessments' ORDER BY created DESC,rowid DESC",pid).map(x=>({id:x.id,...JSON.parse(x.data)}));const replaced=new Set(entries.map(x=>x.supersedes).filter(Boolean));return entries.filter(x=>!replaced.has(x.id))})(),
      });
      return true;
    }
    if (
      [
        "plan",
        "assessments",
        "diary",
        "habits",
        "intake",
        "messages",
        "shopping",
        "goals",
        "recipes",
        "choices",
        "plan-draft",
      ].includes(kind)
    ) {
      if (kind === "plan-draft" && u.role !== "nutritionist")
        fail(403, "Rascunho privado do profissional.");
      if (method === "GET") {
        audit(u, "read-" + kind, pid);
        let items = records();
        // Messages belong to a relationship, not the patient's shared history.
        // Unattributed legacy rows are retained, without guessing their link.
        if (kind === "messages")
          items = items.filter((x) => x.linkId === access.link.id);
        if (kind === "plan-draft")
          items = items.filter((x) => x.authorId === u.id);
        if(kind==="assessments"){const replaced=new Set(items.map(x=>x.supersedes).filter(Boolean));items=items.map(x=>({...x,superseded:replaced.has(x.id)}))}
        if (kind === "shopping" && url.searchParams.get("generate") === "1") {
          const days = Math.round(
              number(url.searchParams.get("days") || 7, 1, 31),
            ),
            plan = all(
              "SELECT id,created,data FROM records WHERE patient_id=? AND kind='plan' ORDER BY created DESC,rowid DESC LIMIT 1",
              pid,
            )[0];
          items = [
            {
              days,
              planVersion: plan ? { id: plan.id, created: plan.created } : null,
              items: shoppingFromPlan(
                plan ? JSON.parse(plan.data) : { items: [] },
                days,
                items[0]?.items || [],
              ),
            },
          ];
        }
        json(
          res,
          200,
          kind === "plan"
            ? { current: items[0] || null, versions: items }
            : { items },
        );
        return true;
      }
      const writerPro = [
        "plan",
        "plan-draft",
        "assessments",
        "goals",
        "recipes",
      ].includes(kind);
      if (writerPro && u.role !== "nutritionist")
        fail(403, "Somente o nutricionista altera este recurso.");
      if (!writerPro && kind !== "messages" && u.id !== pid)
        fail(403, "Somente o paciente altera este recurso.");
      if (["plan", "plan-draft"].includes(kind) && method === "PUT") {
        if (!Array.isArray(b.items) || b.items.length > 200)
          fail(400, "Plano inválido.");
        const catalog = await loadCatalog(),
          items = calculateItems(b.items, catalog, b.catalogVersion);
        const data = {
          items,
          note: text(b.note || "", 2000),
          source: catalog.source.name,
          catalogVersion: catalog.version,
        };
        let id;
        c.db.exec("BEGIN IMMEDIATE");
        try {
          run(
            "DELETE FROM records WHERE patient_id=? AND kind='plan-draft' AND author_id=?",
            pid,
            u.id,
          );
          id = save(data);
          c.db.exec("COMMIT");
        } catch (e) {
          c.db.exec("ROLLBACK");
          throw e;
        }
        json(res, 201, { id });
        return true;
      }
      if (kind === "assessments" && ["POST","PUT"].includes(method)) {
        if(method==="PUT"&&(!itemId||!get("SELECT id FROM records WHERE id=? AND patient_id=? AND kind='assessments'",itemId,pid)))fail(404,"Avaliação indisponível.");
        if(method==='PUT'&&get("SELECT id FROM records WHERE patient_id=? AND kind='assessments' AND json_extract(data,'$.supersedes')=?",pid,itemId))fail(409,'Esta avaliação já foi corrigida. Reabra a versão atual.');
        const data = {
          date: date(b.date),
          height: number(b.height, 80, 250),
          weight: number(b.weight, 15, 400),
          waist: number(b.waist, 30, 220),
          hip: number(b.hip, 40, 250),
          note: text(b.note || "", 1000),
          ...(method==="PUT"?{supersedes:itemId}:{})
        };
        json(res, 201, { id: save(data) });
        return true;
      }
      if (kind === "diary" && method === "POST") {
        json(res, 201, {
          id: save({
            date: date(b.date),
            text: text(b.text, 2000),
            feeling: text(b.feeling || "", 50),
          }),
        });
        return true;
      }
      if (kind === "messages" && method === "POST") {
        c.limit("messages:" + u.id, 100);
        const value = text(b.text, 2000);
        if (!value) fail(400, "Mensagem vazia.");
        json(res, 201, {
          id: save({ text: value, from: u.id, name: u.name, linkId: access.link.id }),
        });
        return true;
      }
      if (kind === "habits" && method === "PUT") {
        const day = date(b.date);
        if (day > stamp(now).slice(0, 10))
          fail(400, "Não registre dias futuros.");
        const data = {
          date: day,
          water: number(b.water ?? 0, 0, 10),
          goalDone: b.goalDone === true,
          meals: Array.isArray(b.meals)
            ? b.meals.slice(0, 12).map((x) => text(x, 50))
            : [],
        };
        const previous = all(
          "SELECT id,data FROM records WHERE patient_id=? AND kind=?",
          pid,
          kind,
        ).find((x) => JSON.parse(x.data).date === day);
        if (previous)
          run(
            "UPDATE records SET data=?,created=? WHERE id=?",
            JSON.stringify(data),
            stamp(now),
            previous.id,
          );
        else save(data);
        json(res, 200, { message: "Dia atualizado." });
        return true;
      }
      if (kind === "intake" && method === "PUT") {
        const data = {
          allergies: text(b.allergies || "", 500),
          medication: text(b.medication || "", 500),
          sleep: text(b.sleep || "", 100),
          objective: text(b.objective || "", 500),
          note: text(b.note || "", 1000),
        };
        json(res, 201, { id: save(data) });
        return true;
      }
      if (kind === "goals" && method === "PUT") {
        const title = text(b.title, 100);
        if (/\d+([.,]\d+)?\s*(kg|quilos?)/i.test(title))
          fail(400, "Use uma meta de hábito, sem alvo de peso.");
        json(res, 201, {
          id: save({
            title,
            days: Math.round(number(b.days, 1, 7)),
            start: date(b.start),
          }),
        });
        return true;
      }
      if (kind === "shopping" && method === "PUT") {
        if (!Array.isArray(b.items) || b.items.length > 300)
          fail(400, "Lista inválida.");
        const data = {
          items: b.items.map((x) => ({
            name: text(x.name, 150),
            done: x.done === true,
            extra: x.extra === true,
            grams: number(x.grams ?? 0, 0, 1000000),
            manual: Array.isArray(x.manual)
              ? x.manual.slice(0, 20).map((v) => text(v, 100))
              : [],
          })),
          days: Math.round(number(b.days ?? 7, 1, 31)),
        };
        run("DELETE FROM records WHERE patient_id=? AND kind=?", pid, kind);
        json(res, 201, { id: save(data) });
        return true;
      }
      if (kind === "choices" && method === "PUT") {
        json(res, 201, {
          id: save({
            text: text(b.text, 1000),
            date: date(b.date || stamp(now).slice(0, 10)),
          }),
        });
        return true;
      }
      if (kind === "recipes" && method === "POST") {
        const catalog = await loadCatalog(),
          items = calculateItems(b.items || [], catalog, b.catalogVersion),
          portions = Math.round(number(b.portions, 1, 100));
        const data = {
          name: text(b.name, 150),
          ingredients: text(b.ingredients || "", 3000),
          instructions: text(b.instructions, 3000),
          portions,
          items,
          nutrition: recipeNutrition(items, portions, b.ingredients || ""),
          source: catalog.source.name,
        };
        json(res, 201, { id: save(data) });
        return true;
      }
    }
    if (kind === "files") {
      if (method === "GET") {
        const items = all(
          "SELECT id,kind,mime,name,created FROM files WHERE patient_id=?",
          pid,
        ).filter((x) => x.kind !== "photo" || access.consents.photos);
        json(res, 200, { items });
        return true;
      }
      if (method === "POST") {
        c.limit('upload:'+u.id,20);
        const usage=get('SELECT COUNT(*) AS n,COALESCE(SUM(length(content)),0) AS bytes FROM files WHERE patient_id=?',pid);if(usage.n>=100||usage.bytes>=100*1024*1024)fail(413,'Limite de arquivos do acompanhamento atingido. Remova arquivos desnecessários ou revise o limite com o responsável pela plataforma.');
        const kind = b.kind === "photo" ? "photo" : "exam";
        if (kind === "photo" && !access.consents.photos)
          fail(403, "Fotos não autorizadas.");
        if (typeof b.content !== "string" || b.content.length > 11200000)
          fail(413, "Arquivo muito grande.");
        const content = Buffer.from(b.content, "base64");
        if(usage.bytes+content.length>100*1024*1024)fail(413,"O acompanhamento ultrapassaria o limite de 100 MB.");
        if (!content.length || content.length > 8 * 1024 * 1024)
          fail(413, "Arquivo deve ter até 8 MB.");
        const mime = text(b.mime, 50),
          head = content.subarray(0, 12);
        const valid =
          (mime === "image/jpeg" && head[0] === 255 && head[1] === 216) ||
          (mime === "image/png" &&
            head.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") ||
          (mime === "image/webp" &&
            head.toString("ascii", 0, 4) === "RIFF" &&
            head.toString("ascii", 8, 12) === "WEBP") ||
          (kind === "exam" &&
            mime === "application/pdf" &&
            head.toString("ascii", 0, 5) === "%PDF-");
        if (!valid)
          fail(
            400,
            "Tipo de arquivo inválido. Use JPG, PNG, WEBP ou PDF para exames.",
          );
        const id = token().slice(0, 22);
        run(
          "INSERT INTO files VALUES(?,?,?,?,?,?,?)",
          id,
          pid,
          kind,
          mime,
          text(b.name, 150),
          content,
          stamp(now),
        );
        audit(u, "file-upload", pid);
        json(res, 201, { id });
        return true;
      }
      if (method === "DELETE" && itemId) {
        run("DELETE FROM files WHERE id=? AND patient_id=?", itemId, pid);
        audit(u, "file-delete", pid);
        json(res, 200, { message: "Arquivo removido." });
        return true;
      }
    }
  }
  const file = /^\/api\/files\/([^/]+)$/.exec(path);
  if (file && method === "GET") {
    const f = get("SELECT * FROM files WHERE id=?", file[1]);
    if (!f) fail(404, "Arquivo indisponível.");
    authorize(c, f.patient_id, {
      permission: f.kind === "photo" ? "photos" : undefined,
    });
    audit(u, "file-read", f.patient_id);
    res.writeHead(200, {
      "Content-Type": f.mime,
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="arquivo-${f.id}.${f.mime === "application/pdf" ? "pdf" : "img"}"`,
    });
    res.end(Buffer.from(f.content));
    return true;
  }
  if (path === "/api/appointments" && method === "GET") {
    json(res, 200, {
      items: all(
        `SELECT appointments.*,users.name AS patientName FROM appointments JOIN users ON users.id=appointments.patient_id WHERE ${u.role === "nutritionist" ? "nutritionist_id" : "patient_id"}=? ORDER BY start`,
        u.id,
      ).map((x) => ({ ...x, ...JSON.parse(x.data) })),
    });
    return true;
  }
  const appt = /^\/api\/appointments(?:\/([^/]+))?$/.exec(path);
  if (appt && ["POST", "PUT"].includes(method)) {
    const old = appt[1]
      ? get("SELECT * FROM appointments WHERE id=?", appt[1])
      : null;
    if (
      appt[1] &&
      (!old || ![old.patient_id, old.nutritionist_id].includes(u.id))
    )
      fail(403, "Consulta indisponível.");
    if (u.role === "patient") {
      if (
        !old ||
        !["scheduled", "confirmed"].includes(old.status) ||
        !["cancelled", "confirmed"].includes(b.status)
      )
        fail(403, "Somente o profissional agenda consultas.");
      run("UPDATE appointments SET status=? WHERE id=?", b.status, old.id);
      if (b.status === "cancelled")
        run(
          "UPDATE reminders SET status='cancelled' WHERE appointment_id=? AND status IN ('pending','failed')",
          old.id,
        );
      json(res, 200, { id: old.id });
      return true;
    }
    const pid = old?.patient_id || text(b.patientId, 100);
    authorize(c, pid);
    const status = b.status || old?.status || "scheduled";
    if (
      !["scheduled", "confirmed", "cancelled", "completed", "missed"].includes(
        status,
      )
    )
      fail(400, "Situação inválida.");
    const start = new Date(b.start || old?.start);
    if (!Number.isFinite(start.getTime())) fail(400, "Horário inválido.");
    const minutes = Math.round(
        number(
          b.minutes ??
            (old ? (new Date(old.end) - new Date(old.start)) / 60000 : 60),
          10,
          240,
        ),
      ),
      end = new Date(start.getTime() + minutes * 60000);
    const id = old?.id || token().slice(0, 22);
    if (
      ["scheduled", "confirmed"].includes(status) &&
      get(
        "SELECT id FROM appointments WHERE nutritionist_id=? AND id<>? AND status IN ('scheduled','confirmed') AND start<? AND end>?",
        u.id,
        id,
        end.toISOString(),
        start.toISOString(),
      )
    )
      fail(409, "Já existe uma consulta neste horário.");
    const data = {
      mode: text(b.mode || (old ? JSON.parse(old.data).mode : "online"), 50),
      note: text(b.note ?? (old ? JSON.parse(old.data).note : ""), 500),
    };
    if (old)
      run(
        "UPDATE appointments SET start=?,end=?,status=?,data=? WHERE id=?",
        start.toISOString(),
        end.toISOString(),
        status,
        JSON.stringify(data),
        id,
      );
    else
      run(
        "INSERT INTO appointments VALUES(?,?,?,?,?,?,?)",
        id,
        pid,
        u.id,
        start.toISOString(),
        end.toISOString(),
        status,
        JSON.stringify(data),
      );
    run(
      "UPDATE reminders SET status='cancelled' WHERE appointment_id=? AND status IN ('pending','failed')",
      id,
    );
    if (["scheduled", "confirmed"].includes(status))
      run(
        "INSERT INTO reminders VALUES(?,?,?,?,?,?)",
        token().slice(0, 22),
        id,
        u.id,
        new Date(start.getTime() - 86400000).toISOString(),
        "pending",
        JSON.stringify({
          channel: "whatsapp",
          configured: !!process.env.WHATSAPP_TOKEN,
        }),
      );
    audit(u, "appointment-updated", pid);
    json(res, old ? 200 : 201, { id });
    return true;
  }
  if (path === "/api/reminders" && method === "GET") {
    if (u.role !== "nutritionist")
      fail(403, "Acesso exclusivo do profissional.");
    json(res, 200, {
      items: all(
        "SELECT * FROM reminders WHERE nutritionist_id=? ORDER BY due",
        u.id,
      ),
    });
    return true;
  }
  if (path === "/api/finance") {
    if (u.role !== "nutritionist")
      fail(403, "Acesso exclusivo do profissional.");
    if (method === "GET") {
      const items = all(
        "SELECT * FROM finance WHERE nutritionist_id=?",
        u.id,
      ).map((x) => ({
        id: x.id,
        patientId: x.patient_id,
        ...JSON.parse(x.data),
      }));
      json(res, 200, {
        items,
        paid: items
          .filter((x) => x.status === "paid")
          .reduce((n, x) => n + x.amount, 0),
        pending: items
          .filter((x) => x.status === "pending")
          .reduce((n, x) => n + x.amount, 0),
      });
      return true;
    }
    if (method === "POST") {
      const pid = text(b.patientId, 100);
      authorize(c, pid);
      if (!["paid", "pending", "cancelled"].includes(b.status))
        fail(400, "Situação inválida.");
      const data = {
        amount: Math.round(number(b.amount, 1, 100000000)),
        due: date(b.due),
        status: b.status,
        description: text(b.description, 200),
      };
      const id = token().slice(0, 22);
      run(
        "INSERT INTO finance VALUES(?,?,?,?)",
        id,
        u.id,
        pid,
        JSON.stringify(data),
      );
      json(res, 201, { id });
      return true;
    }
  }
  const fin = /^\/api\/finance\/([^/]+)$/.exec(path);
  if (fin && method === "PUT") {
    const f = get(
      "SELECT * FROM finance WHERE id=? AND nutritionist_id=?",
      fin[1],
      u.id,
    );
    if (!f) fail(403, "Lançamento indisponível.");
    if (!["paid", "pending", "cancelled"].includes(b.status))
      fail(400, "Situação inválida.");
    run(
      "UPDATE finance SET data=? WHERE id=?",
      JSON.stringify({ ...JSON.parse(f.data), status: b.status }),
      f.id,
    );
    json(res, 200, { message: "Lançamento atualizado." });
    return true;
  }
  return false;
}
