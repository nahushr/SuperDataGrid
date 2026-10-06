import { describe, expect, it } from "vitest";
import { createFilterFields, getFilterFieldValue } from "../src/utils/filterFields";
import type { SuperDataGridFilterField } from "../src/types";

describe("filter field discovery", () => {
  const columns = [
    { field: "id", headerName: "User ID", type: "number" as const },
    { field: "person", headerName: "Person Details" },
    { field: "audit", headerName: "Created By" },
    { field: "hidden", filterable: false },
    { field: "actions" },
  ];
  const rows = [
    { id: 1, person: { name: "Ada", email: "ada@example.com", nested: { enabled: true } }, audit: { user: { name: "Sam", email: "sam@example.com" }, timestamp: "2026-01-01" }, hidden: "x", actions: [] },
    { id: 2, person: { name: "Lin", email: "lin@example.com", nested: { enabled: false } }, audit: { fullName: "Jo", email: "jo@example.com", timestamp: "2026-02-01" }, hidden: "y", actions: [] },
  ];

  it("discovers nested JSON leaves and adds the predefined audit filter fields", () => {
    const fields = createFilterFields(columns, rows, { person: "peopleDetails", actions: "actions" });
    expect(fields.map(({ field }) => field)).toEqual(expect.arrayContaining([
      "id", "person", "person.name", "person.email", "person.nested.enabled",
      "audit", "audit.fullName", "audit.email", "audit.timestamp",
    ]));
    expect(fields.some(({ field }) => field === "hidden" || field.startsWith("actions."))).toBe(false);
    expect(fields.find(({ field }) => field === "person.nested.enabled")?.type).toBe("boolean");
    expect(fields.find(({ field }) => field === "audit.timestamp")?.type).toBe("date");
  });

  it("handles recursive arrays, dates, nulls, and the maximum discovery depth", () => {
    const fields = createFilterFields([{ field: "meta" }], [
      { meta: [{ when: new Date("2026-01-01"), code: 3 }] },
      { meta: [{ when: new Date("2026-02-01"), code: 4 }] },
    ]);
    expect(fields.find(({ field }) => field === "meta.when")?.type).toBe("date");
    expect(fields.find(({ field }) => field === "meta.code")?.type).toBe("number");
    const deepRow = { deep: { a: { b: { c: { d: { e: { f: 1 } } } } } } };
    expect(createFilterFields([{ field: "deep" }], [deepRow]).some(({ field }) => field === "deep.a.b.c.d.e.f")).toBe(false);
    expect(createFilterFields([{ field: "none" }], [{ none: null }])).toHaveLength(1);
  });

  it("resolves nested values including predefined person and audit values", () => {
    const personField: SuperDataGridFilterField = { field: "person.name", headerName: "Name", parentField: "person", nestedPath: "name" };
    const auditField: SuperDataGridFilterField = { field: "audit.fullName", headerName: "Created By · Full Name", parentField: "audit", nestedPath: "fullName" };
    const nestedField: SuperDataGridFilterField = { field: "person.nested.enabled", headerName: "Enabled", parentField: "person", nestedPath: "nested.enabled" };
    expect(getFilterFieldValue(rows[0], personField, { person: "peopleDetails" })).toBe("Ada");
    expect(getFilterFieldValue(rows[0], auditField, { audit: "audit" })).toBe("Sam");
    expect(getFilterFieldValue(rows[0], { ...auditField, nestedPath: "timestamp" }, { audit: "audit" })).toBe("2026-01-01");
    expect(getFilterFieldValue(rows[0], nestedField)).toBe(true);
    expect(getFilterFieldValue(rows[0], { ...nestedField, nestedPath: "missing.value" })).toEqual([]);
    expect(getFilterFieldValue(rows[0], { field: "id", headerName: "Id" })).toBe(1);
    expect(getFilterFieldValue({ person: [{ email: "one" }, { email: "two" }] }, { ...nestedField, nestedPath: "email" })).toEqual(["one", "two"]);
  });
});
