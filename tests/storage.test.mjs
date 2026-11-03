import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { readPreference, writePreference } = await loadTypeScript("../src/utils/storage.ts");
const previousWindow = globalThis.window;

afterEach(() => {
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
});

test("server rendering does not require browser storage", () => {
  delete globalThis.window;
  assert.equal(readPreference("workspace"), null);
  assert.doesNotThrow(() => writePreference("workspace", "id"));
});

test("current preference wins over legacy workspace selections", () => {
  const data = new Map([["workspace", "current"], ["legacy", "old"]]);
  globalThis.window = { localStorage: { getItem: (key) => data.get(key) ?? null } };
  assert.equal(readPreference("workspace", ["legacy"]), "current");
  data.delete("workspace");
  assert.equal(readPreference("workspace", ["legacy"]), "old");
});

test("blocked storage does not turn a successful workspace request into an error", () => {
  globalThis.window = { get localStorage() { throw new Error("Storage blocked"); } };
  assert.equal(readPreference("workspace", ["legacy"]), null);
  assert.doesNotThrow(() => writePreference("workspace", "id"));
});

test("full storage does not discard an in-memory workspace selection", () => {
  const data = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => data.get(key) ?? null,
    setItem: () => { throw new Error("Quota exceeded"); },
  } };
  assert.doesNotThrow(() => writePreference("workspace", "id"));
  assert.equal(readPreference("workspace"), null);
});

test("preferences are persisted when storage is available", () => {
  const data = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  } };
  writePreference("workspace", "id");
  assert.equal(readPreference("workspace"), "id");
});
