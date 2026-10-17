import { test } from "node:test";
import assert from "node:assert/strict";
import { date } from "../../server/security.mjs";
test("datas inválidas são erro de entrada, incluindo mês impossível", () => {
  for (const value of ["2026-13-01", "2026-02-30", "2026-10-99", "not-a-date"])
    assert.throws(
      () => date(value),
      (e) => e.status === 400,
    );
  assert.equal(date("2028-02-29"), "2028-02-29");
});
