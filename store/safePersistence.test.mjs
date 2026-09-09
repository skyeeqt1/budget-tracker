import assert from "node:assert/strict";
import { test } from "node:test";
import { createStore } from "zustand/vanilla";
import { createSafePersistence } from "./safePersistence.ts";
import { restoreBackup } from "../lib/restoreBackup.ts";

const sheet = { id: "original", budget: 500, startDate: "2026-08-06", endDate: "2026-08-06", createdAt: 1785974400000 };
const expense = { id: "e", title: "Internet", amount: 10, date: "2026-08-09", category: "internet", sheetId: "original", createdAt: 1785974400001 };
const valid = (version = 3) => ({ version, state: { sheets: [sheet], expenses: [expense], hydrated: true } });

function setup(raw, read = async () => raw) {
  let original = raw;
  const writes = [];
  const persistence = createSafePersistence({
    getItem: read,
    setItem: async (_key, value) => { writes.push(value); original = value; },
    removeItem: async () => { throw new Error("must not delete"); },
  });
  const store = createStore(persistence.wrap((set) => ({
    sheets: [], expenses: [], hydrated: false,
    edit: () => set({ sheets: [{ ...sheet, budget: 700 }] }),
    setHydrated: () => set({ hydrated: true }),
  })));
  return { store, status: persistence.status, writes, original: () => original };
}

async function settle(status) {
  if (status.getState().phase !== "loading") return;
  await new Promise((resolve) => {
    const unsubscribe = status.subscribe(({ phase }) => {
      if (phase !== "loading") { unsubscribe(); resolve(); }
    });
  });
}

test("version 3 hydrates linked records without startup writes, then permits edits", async () => {
  const raw = `\n${JSON.stringify(valid(), null, 2)}\n`;
  const { store, status, writes, original } = setup(raw);
  await settle(status);
  assert.equal(status.getState().phase, "ready");
  assert.equal(store.persist.hasHydrated(), true);
  assert.equal(store.getState().hydrated, true);
  assert.deepEqual(store.getState().sheets, [sheet]);
  assert.deepEqual(store.getState().expenses, [expense]);
  assert.deepEqual(writes, []);
  assert.equal(original(), raw);
  store.getState().edit();
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0]), { version: 3, state: { sheets: [{ ...sheet, budget: 700 }], expenses: [expense] } });
});

test("missing storage is a successful fresh install without writing empty defaults", async () => {
  const { store, status, writes } = setup(null);
  await settle(status);
  assert.equal(status.getState().phase, "ready");
  assert.deepEqual(store.getState().sheets, []);
  assert.deepEqual(writes, []);
  store.getState().edit();
  assert.equal(writes.length, 1);
});

const invalid = ["", "{", "null", "[]", ...[0, 1, 2, 4, "3", null, undefined].map((version) => {
  const value = valid(); value.version = version; return JSON.stringify(value);
}), JSON.stringify({ version: 3, state: { sheets: [], expenses: [expense] } }),
JSON.stringify({ version: 3, state: { sheets: [sheet], expenses: [{ ...expense, sheetId: undefined }] } }),
JSON.stringify({ version: 3, state: { sheets: [sheet], expenses: [], edit: null } }),
JSON.stringify({ version: 3, state: { sheets: [sheet], expenses: [], hydrated: "true" } })];

for (const [index, raw] of invalid.entries()) {
  test(`unsupported/corrupt input ${index} stays byte-identical and blocks every setter`, async () => {
    const { store, status, writes, original } = setup(raw);
    await settle(status);
    assert.equal(status.getState().phase, "error");
    assert.equal(store.persist.hasHydrated(), false);
    store.getState().edit();
    store.getState().setHydrated();
    store.setState({ sheets: [sheet], hydrated: true });
    await store.persist.clearStorage();
    assert.deepEqual(store.getState().sheets, []);
    assert.equal(store.getState().hydrated, false);
    assert.deepEqual(writes, []);
    assert.equal(original(), raw);
    await store.persist.rehydrate();
    assert.equal(status.getState().phase, "error");
    assert.deepEqual(writes, []);
    assert.equal(original(), raw);
  });
}

test("pending reads block actions, external setters and hydration-flag writes", async () => {
  let release;
  const raw = JSON.stringify(valid());
  const { store, status, writes } = setup(raw, () => new Promise((resolve) => { release = resolve; }));
  store.getState().edit();
  store.getState().setHydrated();
  store.setState({ hydrated: true });
  assert.equal(status.getState().phase, "loading");
  assert.equal(store.getState().hydrated, false);
  assert.deepEqual(writes, []);
  release(raw);
  await settle(status);
  assert.equal(status.getState().phase, "ready");
  assert.deepEqual(store.getState().sheets, [sheet]);
  assert.deepEqual(writes, []);
});

test("read failure (including undefined rejection) stays locked; retry can succeed", async () => {
  for (const error of [new Error("read failed"), undefined]) {
    let fail = true;
    const raw = JSON.stringify(valid());
    const { store, status, writes, original } = setup(raw, async () => {
      if (fail) throw error;
      return raw;
    });
    await settle(status);
    assert.equal(status.getState().phase, "error");
    store.getState().edit();
    assert.equal(original(), raw);
    assert.deepEqual(writes, []);
    fail = false;
    await store.persist.rehydrate();
    assert.equal(status.getState().phase, "ready");
    assert.deepEqual(store.getState().sheets, [sheet]);
    assert.deepEqual(writes, []);
  }
});

test("restore from recovery writes only validated JSON and stays gated until restart", async () => {
  const { store, status, writes } = setup("{broken");
  await settle(status);
  let disk = "{broken";
  await assert.rejects(restoreBackup(JSON.stringify(valid(2)), async (raw) => { disk = raw; }));
  assert.equal(disk, "{broken");
  const raw = JSON.stringify(valid());
  await restoreBackup(raw, async (value) => { disk = value; });
  store.getState().edit();
  assert.equal(status.getState().phase, "error");
  assert.deepEqual(writes, []);
  assert.equal(disk, raw);
  const restarted = setup(disk);
  await settle(restarted.status);
  assert.equal(restarted.status.getState().phase, "ready");
  assert.deepEqual(restarted.store.getState().expenses, [expense]);
});
