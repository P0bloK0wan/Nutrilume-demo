import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateCatalog } from "../server/nutrition.mjs";
const [input, output] = process.argv.slice(2);
if (!input || !output)
  throw new Error(
    "Uso: node scripts/import-foods.mjs arquivo-revisado.json data/catalog.json",
  );
const data = JSON.parse(await readFile(input, "utf8"));
if (Array.isArray(data) || !data.source?.reviewedBy)
  throw new Error(
    "Informe source.name, source.reviewedBy e source.version no arquivo revisado.",
  );
const valid = validateCatalog(data);
const target = resolve(output);
await mkdir(dirname(target), { recursive: true, mode: 0o700 });
await writeFile(
  target,
  JSON.stringify({ source: data.source, items: valid.items }),
  { flag: "wx", mode: 0o600 },
);
console.log(
  `Catálogo validado: ${valid.items.length} alimentos, versão ${valid.version}. Configure FOOD_CATALOG e reinicie o servidor.`,
);
