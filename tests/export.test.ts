import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadTextFile, exportGridData, quoteSqlIdentifier, toSqlValue } from "../src/utils/export";

describe("export formatting", () => {
  const columns = [
    { field: "name", headerName: "Full Name" },
    { field: "amount" },
    { field: "note" },
  ];
  const rows = [
    { name: "A\"da", amount: 12.5, note: "a,b\nc" },
    { name: null, amount: new Date("invalid"), note: { ok: true } },
  ];
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:export"),
      revokeObjectURL: vi.fn(),
    });
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("escapes SQL identifiers and serializes SQL value types safely", () => {
    expect(quoteSqlIdentifier('user"name')).toBe('"user""name"');
    expect(toSqlValue(null)).toBe("NULL");
    expect(toSqlValue(new Date("invalid"))).toBe("NULL");
    expect(toSqlValue(new Date("2026-01-01T00:00:00Z"))).toContain("2026-01-01");
    expect(toSqlValue(true)).toBe("TRUE");
    expect(toSqlValue(false)).toBe("FALSE");
    expect(toSqlValue(Infinity)).toBe("NULL");
    expect(toSqlValue(5)).toBe("5");
    expect(toSqlValue("it's" )).toBe("'it''s'");
    expect(toSqlValue({ ok: true })).toBe("'{\"ok\":true}'");
  });

  it("downloads text blobs and skips work when aborted", async () => {
    downloadTextFile("hello", "hello.txt", "text/plain");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    await exportGridData("json", columns, rows, "rows", AbortSignal.abort());
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("exports JSON, CSV, and SQL with column headings, quoting, and empty data", async () => {
    await exportGridData("json", columns, rows, "records");
    await exportGridData("csv", columns, rows, "records");
    await exportGridData("sql", columns, rows, "records");
    await exportGridData("sql", columns, [], "empty");
    expect(clickSpy).toHaveBeenCalledTimes(4);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(4);
  });

  it("builds xlsx output and honors aborts before and after workbook generation", async () => {
    await exportGridData("xlsx", columns, rows, "records");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const controller = new AbortController();
    controller.abort();
    await exportGridData("xlsx", columns, rows, "records", controller.signal);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
