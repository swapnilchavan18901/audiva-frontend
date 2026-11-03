import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { retryAfterSeconds } = await loadTypeScript("../src/utils/retry.ts");

test("Retry-After supports seconds and HTTP dates", () => {
  const now = Date.parse("2026-11-03T00:00:00Z");
  assert.equal(retryAfterSeconds(" 60 ", now), 60);
  assert.equal(retryAfterSeconds("0", now), 0);
  assert.equal(retryAfterSeconds("Tue, 03 Nov 2026 00:01:30 GMT", now), 90);
  assert.equal(retryAfterSeconds("Mon, 02 Nov 2026 00:00:00 GMT", now), 0);
});

test("invalid retry hints do not create NaN or unbounded numeric waits", () => {
  for (const value of [undefined, null, {}, "", "not-a-date", "-1", "1.5", "Infinity", "9999999999999999999999999"]) {
    assert.equal(retryAfterSeconds(value), null);
  }
});
