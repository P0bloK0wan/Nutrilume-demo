import { dispatchDueReminders, whatsappSender } from "./reminders.mjs";
import { createApp } from "./app.mjs";
import { mailer } from "./mail.mjs";
import { dirname } from "node:path";
const production = process.env.NODE_ENV === "production",
  port = Number(process.env.PORT || 3000),
  baseURL = process.env.APP_URL || `http://localhost:${port}`,
  database = process.env.DATABASE_PATH || "data/nutrilume.sqlite";
if (
  production &&
  (!baseURL.startsWith("https://") ||
    !process.env.RESEND_API_KEY ||
    !process.env.MAIL_FROM)
)
  throw new Error("Produção exige APP_URL HTTPS, RESEND_API_KEY e MAIL_FROM.");
const app = await createApp({
  database,
  production,
  baseURL,
  mail: mailer({ production, baseURL, directory: dirname(database) }),
});
const server = app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(
    `Nutrilume: ${baseURL} (${production ? "produção" : "desenvolvimento; e-mails na caixa local"})`,
  ),
);
const sender = whatsappSender();
let dispatching = false;
if (sender)
  setInterval(async () => {
    if (dispatching) return;
    dispatching = true;
    try {
      await dispatchDueReminders({ db: app.db, send: sender });
    } finally {
      dispatching = false;
    }
  }, 30000).unref();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      app.close();
      process.exit(0);
    }),
  );
