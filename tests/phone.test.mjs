import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { normalizePhoneNumber, isValidPhoneNumber } = await loadTypeScript("../src/utils/phone.ts");

test("clinic and campaign numbers accept the same country-code formats", () => {
  for (const value of ["+91 98765 43210", "+1 (415) 555-0123", " +44.20.7946.0958 "]) {
    assert.equal(isValidPhoneNumber(value), true, value);
    assert.match(normalizePhoneNumber(value), /^\+[1-9]\d{7,14}$/);
  }
});

test("invalid destinations cannot pass frontend phone validation", () => {
  for (const value of ["", "9876543210", "+0123456789", "+1234567", "+1234567890123456", "+91abc9876543210", "+91+9876543210"]) {
    assert.equal(isValidPhoneNumber(value), false, value);
  }
});

test("normalization preserves the destination without inventing a country code", () => {
  assert.equal(normalizePhoneNumber("+91 (98765) 43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("98765-43210"), "9876543210");
  assert.equal(isValidPhoneNumber("+12345678"), true);
  assert.equal(isValidPhoneNumber("+123456789012345"), true);
});
