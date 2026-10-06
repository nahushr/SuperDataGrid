import { describe, expect, it } from "vitest";
import * as publicApi from "../src";
import { SUPER_DATA_GRID_AVATAR_COLORS, getAvatarColorIndex } from "../src/utils/avatar";
import {
  getColumnHeaderHeight,
  inferColumnType,
  isGridRowId,
  toDisplayValue,
  toHeaderName,
} from "../src/utils/gridData";
import {
  asRecord,
  firstText,
  getCurrencyAmount,
  getCurrencyCode,
  getImageParts,
  getProductImages,
  parseDateValue,
} from "../src/utils/predefinedCellData";

describe("grid data helpers", () => {
  it("formats column headings and chooses a height for long headings", () => {
    expect(toHeaderName("createdAt")).toBe("Created At");
    expect(toHeaderName("account.status-code")).toBe("Account status code");
    expect(toHeaderName("")).toBe("");
    expect(getColumnHeaderHeight([{ field: "name" }])).toBe(72);
    expect(getColumnHeaderHeight([{ field: "name", headerName: "A very long header title beyond a single line" }])).toBe(84);
  });

  it("renders useful values from primitive, date, object, and cyclic input", () => {
    expect(toDisplayValue(undefined)).toBe("");
    expect(toDisplayValue("text")).toBe("text");
    expect(toDisplayValue(0)).toBe("0");
    expect(toDisplayValue(false)).toBe("false");
    expect(toDisplayValue(new Date("invalid"))).toBe("");
    expect(toDisplayValue(new Date("2026-01-02T12:00:00Z"))).not.toBe("");
    expect(toDisplayValue({ id: 1 })).toBe('{"id":1}');
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(toDisplayValue(cyclic)).toBe("[Unserializable value]");
  });

  it("infers booleans, numbers, and named dates but leaves ambiguous values as text", () => {
    expect(inferColumnType("enabled", [{ enabled: true }, { enabled: false }])).toBe("boolean");
    expect(inferColumnType("price", [{ price: 2 }, { price: 3 }])).toBe("number");
    expect(inferColumnType("createdAt", [{ createdAt: "2026-01-02" }])).toBe("date");
    expect(inferColumnType("createdAt", [{ createdAt: "bad" }])).toBe("string");
    expect(inferColumnType("empty", [{ empty: null }])).toBeUndefined();
    expect(inferColumnType("date", [{ date: new Date() }])).toBe("date");
  });

  it("validates grid identifiers", () => {
    expect(isGridRowId("abc")).toBe(true);
    expect(isGridRowId(0)).toBe(true);
    expect(isGridRowId({})).toBe(false);
    expect(isGridRowId(null)).toBe(false);
  });
});

describe("avatar colors", () => {
  it("uses a stable id hash to choose one of ten colors", () => {
    expect(SUPER_DATA_GRID_AVATAR_COLORS).toHaveLength(10);
    expect(getAvatarColorIndex("user-1")).toBe(getAvatarColorIndex("user-1"));
    expect(getAvatarColorIndex(1)).toBe(getAvatarColorIndex("1"));
    expect(getAvatarColorIndex("user-2")).toBeGreaterThanOrEqual(0);
    expect(getAvatarColorIndex("user-2")).toBeLessThan(10);
  });
});

describe("public package entry point", () => {
  it("exports the grid, shared action constants, and renderer data constants", () => {
    expect(publicApi.SuperDataGrid).toBeTypeOf("function");
    expect(publicApi.SUPER_DATA_GRID_ACTIONS.VIEW).toBe("view");
    expect(publicApi.SUPER_DATA_GRID_BADGE_COLORS.SUCCESS).toBe("success");
    expect(publicApi.SUPER_DATA_GRID_AVATAR_COLORS).toHaveLength(10);
    expect(publicApi.SUPER_DATA_GRID_PRODUCT_IMAGE_FIELDS[0]).toMatchObject({ field: "mainImageUrl", label: "Main" });
  });
});

describe("predefined cell data helpers", () => {
  it("reads records and the first non-empty text field", () => {
    expect(asRecord({ id: 1 })).toEqual({ id: 1 });
    expect(asRecord([1])).toBeNull();
    expect(asRecord(null)).toBeNull();
    expect(firstText({ empty: "  ", label: 12 }, ["empty", "label"])).toBe("12");
    expect(firstText(" raw ", ["label"])).toBe("raw");
    expect(firstText(null, ["label"])).toBe("");
  });

  it("parses date values and rejects invalid dates", () => {
    const date = new Date("2026-05-10T00:00:00.000Z");
    expect(parseDateValue(date)).toBe(date);
    expect(parseDateValue({ timestamp: date.toISOString() })?.toISOString()).toBe(date.toISOString());
    expect(parseDateValue(0)?.getTime()).toBe(0);
    expect(parseDateValue("invalid")).toBeNull();
    expect(parseDateValue({})).toBeNull();
    expect(parseDateValue(new Date("invalid"))).toBeNull();
  });

  it("normalizes currency amounts and codes", () => {
    expect(getCurrencyAmount("1,234.50")).toBe(1234.5);
    expect(getCurrencyAmount({ amount: 12345, amountInMinorUnits: true })).toBe(123.45);
    expect(getCurrencyAmount(12345, { amountInMinorUnits: true, minorUnits: 0 })).toBe(12345);
    expect(getCurrencyAmount("bad")).toBeNull();
    expect(getCurrencyAmount(Infinity)).toBeNull();
    expect(getCurrencyCode({ currencyCode: "eur" })).toBe("EUR");
    expect(getCurrencyCode({}, { currencyField: "currency" }, { currency: "gbp" })).toBe("GBP");
    expect(getCurrencyCode(null, { currency: "cad" })).toBe("CAD");
    expect(getCurrencyCode({ currency: 5 })).toBe("USD");
  });

  it("finds unique images in arrays and conventional image fields", () => {
    const images = getProductImages({ images: ["front.jpg", "front.jpg", { src: "back.jpg", title: "Back" }] });
    expect(images).toHaveLength(2);
    expect(images[0]).toMatchObject({ url: "front.jpg", alt: "Image 1" });
    expect(images[1]).toMatchObject({ url: "back.jpg", label: "Back", alt: "Back" });
    expect(getProductImages({ mainImageUrl: "main.jpg", topImageUrl: "top.jpg" })).toHaveLength(2);
    expect(getProductImages("url.jpg")).toEqual([{ url: "url.jpg", label: "Image", alt: "Image" }]);
    expect(getProductImages({})).toEqual([]);
    expect(getProductImages({ images: [{ url: "a", alt: "Alt", category: "Custom" }] }, { altField: "category" })[0].alt).toBe("Custom");
    expect(getImageParts({ images: ["hero.jpg"] })).toEqual({ src: "hero.jpg", alt: "Image 1", label: "Image 1" });
    expect(getImageParts(null, { thumbnailAlt: "No photo" })).toEqual({ src: "", alt: "No photo", label: "" });
  });
});
