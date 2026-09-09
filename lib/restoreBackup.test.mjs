import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIES } from "../constants/categories.ts";
import { restoreBackup } from "./restoreBackup.ts";

function backup() {
  return {
    state: {
      sheets: [
        { id: "past", budget: 1000, startDate: "2024-02-29", endDate: "2024-03-02", createdAt: 1709164800000 },
        { id: "active", budget: 500, startDate: "2024-03-02", endDate: "2024-03-02", createdAt: 1709337600000 },
      ],
      expenses: CATEGORIES.map(({ id, label }, index) => ({
        id: `expense-${index}`, title: label, amount: 10.125, category: id,
        date: "2024-03-05", sheetId: index % 2 ? "active" : "past", createdAt: 1709596800000,
      })),
      hydrated: true,
    },
    version: 3,
  };
}

async function accepts(value) {
  const raw = `\n${JSON.stringify(value, null, 2)}\n`;
  const writes = [];
  await restoreBackup(raw, async (text) => { writes.push(text); });
  assert.deepEqual(writes, [raw], "write exactly once without rewriting the JSON");
}

async function rejects(raw) {
  const writes = [];
  await assert.rejects(restoreBackup(raw, async (text) => { writes.push(text); }));
  assert.deepEqual(writes, [], "invalid backup must never reach storage");
}

test("restores valid version-3 budgets, all categories, and dates outside sheet ranges unchanged", async () => {
  await accepts(backup());
});

test("accepts empty state and optional boolean hydration", async () => {
  for (const hydrated of [undefined, false, true]) {
    await accepts({ version: 3, state: { sheets: [], expenses: [], hydrated } });
  }
});

test("preserves extra envelope/entity data, Unicode, arbitrary IDs, precision and clock changes", async () => {
  const value = backup();
  value.metadata = { source: "personal backup" };
  value.state.sheets[0].note = "preserved";
  value.state.sheets[0].budget = Number.MAX_VALUE;
  value.state.sheets[1].createdAt = -1;
  value.state.expenses[0].id = "active"; // IDs only need to be unique within their collection.
  value.state.expenses[0].title = "\u8cbb\u7528 \ud83d\uded2";
  value.state.expenses[0].amount = Number.MIN_VALUE;
  value.state.expenses[0].createdAt = 0;
  value.state.expenses[0].note = { original: true };
  value.state.expenses[0].date = "2000-02-29";
  await accepts(value);
});

for (const raw of ["", "{", "null", "[]", "true", "42", '"backup"', '{"version":3}', '{"version":3,"state":null}']) {
  test(`rejects malformed JSON/envelope: ${raw}`, async () => { await rejects(raw); });
}

for (const version of [undefined, null, "3", 0, 2, 4, 3.1]) {
  test(`rejects unsupported version ${version}`, async () => {
    const value = backup();
    value.version = version;
    await rejects(JSON.stringify(value));
  });
}

for (const field of ["sheets", "expenses"]) {
  for (const invalid of [undefined, null, {}, "truthy", true, 1]) {
    test(`rejects non-array ${field}: ${JSON.stringify(invalid)}`, async () => {
      const value = backup();
      value.state[field] = invalid;
      await rejects(JSON.stringify(value));
    });
  }
  for (const invalid of [null, [], "record", 1, {}]) {
    test(`rejects invalid ${field} record: ${JSON.stringify(invalid)}`, async () => {
      const value = backup();
      value.state[field].push(invalid);
      await rejects(JSON.stringify(value));
    });
  }
  test(`rejects duplicate ${field} IDs`, async () => {
    const value = backup();
    value.state[field].push({ ...value.state[field][0] });
    await rejects(JSON.stringify(value));
  });
}

for (const hydrated of [null, "true", 1, {}]) {
  test(`rejects non-boolean hydrated: ${JSON.stringify(hydrated)}`, async () => {
    const value = backup();
    value.state.hydrated = hydrated;
    await rejects(JSON.stringify(value));
  });
}

for (const key of ["addExpense", "createBudgetSheet", "unknown", "__proto__", "constructor"]) {
  test(`rejects unexpected merged state key ${key}`, async () => {
    const value = backup();
    value.state = { ...value.state, [key]: null };
    await rejects(JSON.stringify(value));
  });
}

const invalidFields = {
  id: [undefined, null, 123, "", "   "],
  createdAt: [undefined, null, "1709164800000", 0.5, 8640000000000001],
};
const invalidAmounts = [undefined, null, "100", 0, -1];
const invalidDates = [undefined, null, 20240229, "", "2024-2-29", "2023-02-29", "1900-02-29", "2024-04-31", "2024-00-01", "2024-13-01", "2024-01-00", "2024-01-32", "2024-02-29T00:00:00Z"];
for (const [collection, fields] of Object.entries({
  sheets: { ...invalidFields, budget: invalidAmounts, startDate: invalidDates, endDate: invalidDates },
  expenses: {
    ...invalidFields, amount: invalidAmounts, date: invalidDates,
    title: [undefined, null, 1, "", "   "],
    category: [undefined, null, 1, "Other", "food", "__proto__", "constructor"],
    sheetId: [undefined, null, 1, "", "missing"],
  },
})) {
  for (const [field, values] of Object.entries(fields)) {
    for (const invalid of values) {
      test(`rejects ${collection}.${field}: ${JSON.stringify(invalid)}`, async () => {
        const value = backup();
        value.state[collection][0][field] = invalid;
        await rejects(JSON.stringify(value));
      });
    }
  }
}

test("rejects non-finite JSON numbers before writing", async () => {
  for (const field of ["budget", "amount", "createdAt"]) {
    const raw = JSON.stringify(backup()).replace(new RegExp(`"${field}":\\d+(?:\\.\\d+)?`), `"${field}":1e999`);
    assert.equal(JSON.parse(raw).state[field === "amount" ? "expenses" : "sheets"][0][field], Infinity);
    await rejects(raw);
  }
});

test("rejects reversed sheet dates", async () => {
  const value = backup();
  value.state.sheets[0].endDate = "2024-02-28";
  await rejects(JSON.stringify(value));
});

test("rejects expenses without any sheet", async () => {
  const value = backup();
  value.state.sheets = [];
  await rejects(JSON.stringify(value));
});

test("awaits storage completion and propagates storage failures", async () => {
  const error = new Error("Storage unavailable");
  let calls = 0;
  await assert.rejects(restoreBackup(JSON.stringify(backup()), async () => {
    calls += 1;
    throw error;
  }), (actual) => actual === error);
  assert.equal(calls, 1);

  let release;
  const pendingWrite = new Promise((resolve) => { release = resolve; });
  let completed = false;
  const restore = restoreBackup(JSON.stringify(backup()), () => pendingWrite).then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  release();
  await restore;
  assert.equal(completed, true);
});
