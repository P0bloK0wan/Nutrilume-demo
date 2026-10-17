import { randomUUID } from "node:crypto";
// 'accepted' significa aceito pelo provedor; não significa entregue ao telefone.
export async function dispatchDueReminders({ db, send, now = Date.now() }) {
  const rows = db
    .prepare(
      "SELECT reminders.*,appointments.patient_id,appointments.start,appointments.status AS appointment_status,users.profile FROM reminders JOIN appointments ON appointments.id=reminders.appointment_id JOIN users ON users.id=appointments.patient_id WHERE reminders.status='pending' AND reminders.due<=? ORDER BY reminders.due LIMIT 25",
    )
    .all(new Date(now).toISOString());
  const results = [];
  for (const r of rows) {
    const link = db
        .prepare(
          "SELECT consents FROM links WHERE patient_id=? AND nutritionist_id=? AND status='active'",
        )
        .get(r.patient_id, r.nutritionist_id),
      consents = link ? JSON.parse(link.consents) : {},
      profile = JSON.parse(r.profile);
    if (
      !["scheduled", "confirmed"].includes(r.appointment_status) ||
      new Date(r.start).getTime() <= now
    ) {
      db.prepare(
        "UPDATE reminders SET status='cancelled' WHERE id=? AND status='pending'",
      ).run(r.id);
      continue;
    }
    if (
      !consents.health ||
      !consents.reminders ||
      !/^55\d{10,11}$/.test(profile.phone || "")
    ) {
      results.push({ id: r.id, status: "awaiting-opt-in" });
      continue;
    }
    if (!send) {
      results.push({ id: r.id, status: "unconfigured" });
      continue;
    }
    const attempt = randomUUID(),
      claimed = db
        .prepare(
          "UPDATE reminders SET status='sending',data=? WHERE id=? AND status='pending'",
        )
        .run(
          JSON.stringify({ attempt, started: new Date(now).toISOString() }),
          r.id,
        );
    if (!claimed.changes) continue;
    try {
      const result = await send({
        phone: profile.phone,
        start: r.start,
        id: r.id,
      });
      db.prepare(
        "UPDATE reminders SET status='accepted',data=? WHERE id=? AND status='sending'",
      ).run(
        JSON.stringify({
          attempt,
          providerId: result.id,
          accepted: new Date().toISOString(),
        }),
        r.id,
      );
      results.push({ id: r.id, status: "accepted" });
    } catch {
      db.prepare(
        "UPDATE reminders SET status='uncertain',data=? WHERE id=? AND status='sending'",
      ).run(
        JSON.stringify({
          attempt,
          error:
            "Envio não confirmado. Verifique no provedor antes de tentar novamente.",
        }),
        r.id,
      );
      results.push({ id: r.id, status: "uncertain" });
    }
  }
  return results;
}
export function whatsappSender() {
  if (
    !process.env.WHATSAPP_TOKEN ||
    !process.env.WHATSAPP_PHONE_ID ||
    !process.env.WHATSAPP_TEMPLATE
  )
    return null;
  return async ({ phone, start }) => {
    const r = await fetch(
      `https://graph.facebook.com/v23.0/${encodeURIComponent(process.env.WHATSAPP_PHONE_ID)}/messages`,
      {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: process.env.WHATSAPP_TEMPLATE,
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: new Date(start).toLocaleString("pt-BR", {
                      timeZone: process.env.CLINIC_TIMEZONE || "America/Recife",
                    }),
                  },
                ],
              },
            ],
          },
        }),
      },
    );
    if (!r.ok) throw new Error("Envio indisponível.");
    const d = await r.json();
    if (!d.messages?.[0]?.id) throw new Error("Sem confirmação.");
    return { id: d.messages[0].id };
  };
}
