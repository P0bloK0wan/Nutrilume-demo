import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCatalog,
  calculateItems,
  recipeNutrition,
  shoppingFromPlan,
} from "../../server/nutrition.mjs";
const cat = validateCatalog([["Frango", 159, 32, 0, 2.5]]);
test("catálogo não aceita nutrientes inválidos", () => {
  assert.throws(() => validateCatalog([["x", NaN, 1, 2, 3]]));
  assert.throws(() => validateCatalog({ items: cat.items }));
});
test("versão diferente não altera silenciosamente identidade do alimento", () =>
  assert.throws(
    () => calculateItems([{ foodId: 0, grams: 150 }], cat, "antiga"),
    (e) => e.status === 409,
  ));
test("servidor calcula nutrientes e receita por porção", () => {
  const it = calculateItems([{ foodId: 0, grams: 150 }], cat, cat.version);
  assert.equal(it[0].k, 239);
  assert.equal(it[0].p, 48);
  assert.equal(recipeNutrition(it, 2).perPortion.p, 24);
});
test("compras somam repetições e período sem converter porção manual", () => {
  const out = shoppingFromPlan(
    {
      items: [
        { name: "Frango", grams: 100 },
        { name: "Frango", grams: 50 },
        { name: "Arroz", portion: "1 concha" },
      ],
    },
    7,
  );
  assert.equal(out[0].grams, 1050);
  assert.deepEqual(out[1].manual, ["1 concha"]);
});
