import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { digest, fail, text, number } from "./security.mjs";
export function validateCatalog(data) {
  const items = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(items) || !items.length || items.length > 20000)
    fail(400, "Catálogo inválido.");
  for (const f of items)
    if (
      !Array.isArray(f) ||
      f.length !== 5 ||
      typeof f[0] !== "string" ||
      !f[0].trim() ||
      f[0].length > 180 ||
      !f
        .slice(1)
        .every(
          (n) =>
            typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10000,
        )
    )
      fail(400, "Alimento inválido no catálogo.");
  const source = Array.isArray(data)
    ? {
        demo: true,
        name: "Valores aproximados de demonstração; revisão profissional necessária.",
      }
    : data.source;
  if (!source || typeof source.name !== "string" || !source.name.trim())
    fail(400, "Informe a fonte do catálogo.");
  return {
    items,
    source,
    version: digest(JSON.stringify({ items, source })).slice(0, 20),
  };
}
export async function loadCatalog() {
  const path = process.env.FOOD_CATALOG
    ? resolve(process.env.FOOD_CATALOG)
    : new URL("../foods.json", import.meta.url);
  return validateCatalog(JSON.parse(await readFile(path, "utf8")));
}
export function calculateItems(items, catalog, version) {
  if (!Array.isArray(items) || items.length > 200)
    fail(400, "Lista de alimentos inválida.");
  return items.map((x) => {
    const base = {
      name: text(x.name || "", 180),
      portion: text(x.portion || "", 100),
      meal: text(x.meal || "Almoço", 50),
      swaps: text(x.swaps || "", 500),
    };
    if (x.foodId !== undefined && x.foodId !== null && x.foodId !== "") {
      if (
        version !== catalog.version ||
        (x.catalogVersion && x.catalogVersion !== catalog.version)
      )
        fail(
          409,
          "A base de alimentos foi atualizada. Reabra o plano e selecione os alimentos novamente.",
        );
      const f = catalog.items[Number(x.foodId)];
      if (!f) fail(400, "Alimento inválido.");
      const grams = number(x.grams, 1, 2000);
      return {
        ...base,
        name: f[0],
        foodId: Number(x.foodId),
        catalogVersion: catalog.version,
        grams,
        portion: `${grams} g`,
        k: Math.round((f[1] * grams) / 100),
        p: Math.round(f[2] * grams) / 100,
        c: Math.round(f[3] * grams) / 100,
        f: Math.round(f[4] * grams) / 100,
      };
    }
    if (!base.name) fail(400, "Informe o alimento.");
    return base;
  });
}
export function recipeNutrition(items, portions, extra = "") {
  const sum = items.reduce(
    (a, it) => {
      if (Number.isFinite(it.k)) {
        for (const k of ["k", "p", "c", "f"]) a[k] += it[k];
      } else a.missing++;
      return a;
    },
    { k: 0, p: 0, c: 0, f: 0, missing: extra.trim() ? 1 : 0 },
  );
  return {
    ...sum,
    perPortion: Object.fromEntries(
      ["k", "p", "c", "f"].map((k) => [
        k,
        Math.round((sum[k] / portions) * 10) / 10,
      ]),
    ),
  };
}
export function shoppingFromPlan(plan, days, previous = []) {
  const map = new Map();
  for (const it of plan.items) {
    const key = it.name.toLocaleLowerCase("pt-BR"),
      row = map.get(key) || {
        name: it.name,
        grams: 0,
        manual: [],
        done:
          previous.find((x) => x.name.toLocaleLowerCase("pt-BR") === key)
            ?.done || false,
      };
    if (Number.isFinite(it.grams)) row.grams += it.grams * days;
    else row.manual.push(it.portion);
    map.set(key, row);
  }
  for (const x of previous)
    if (x.extra && !map.has(x.name.toLocaleLowerCase("pt-BR")))
      map.set(x.name.toLocaleLowerCase("pt-BR"), x);
  return [...map.values()];
}
