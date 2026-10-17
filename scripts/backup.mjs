import { DatabaseSync } from "node:sqlite";
import { access, mkdir, chmod } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const [source, target] = process.argv.slice(2);
if (!source || !target)
  throw new Error(
    "Uso: node scripts/backup.mjs data/nutrilume.sqlite backups/backup.sqlite",
  );
await access(source);
const output = resolve(target);
await mkdir(dirname(output), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(source, { readOnly: true });
try {
  db.prepare("VACUUM INTO ?").run(output);
} finally {
  db.close();
}
await chmod(output, 0o600);
const copy = new DatabaseSync(output);
try {
  copy.exec("DELETE FROM sessions; DELETE FROM tokens;");
  const result = copy.prepare("PRAGMA integrity_check").get();
  if (result.integrity_check !== "ok")
    throw new Error("Falha na integridade da cópia.");
} finally {
  copy.close();
}
console.log(
  "Backup consistente criado. Sessões e links de acesso antigos foram removidos da cópia. Proteja o arquivo: ele contém dados privados.",
);
