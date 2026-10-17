import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
export function mailer({
  production = false,
  baseURL,
  directory = "data",
} = {}) {
  return async (m) => {
    const url = `${baseURL}/?action=${m.purpose}&token=${encodeURIComponent(m.token)}`;
    if (process.env.RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: [m.to],
          subject:
            m.purpose === "reset"
              ? "Recuperar acesso ao Nutrilume"
              : "Confirme seu e-mail no Nutrilume",
          text: `Olá! Acesse este link para ${m.purpose === "reset" ? "definir sua senha" : "confirmar seu e-mail"}: ${url}\nO link expira. Se não solicitou, ignore esta mensagem.`,
        }),
      });
      if (!r.ok) throw new Error("Envio de e-mail indisponível.");
      return;
    }
    if (production) throw new Error("E-mail de produção não configurado.");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await appendFile(
      join(directory, "mailbox.ndjson"),
      JSON.stringify({
        to: m.to,
        purpose: m.purpose,
        url,
        created: new Date().toISOString(),
      }) + "\n",
      { mode: 0o600 },
    );
  };
}
