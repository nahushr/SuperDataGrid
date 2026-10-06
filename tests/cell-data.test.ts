import { describe, expect, it } from "vitest";
import {
  formatAuditTimestamp,
  getAddressParts,
  getAuditPeopleDetailsParts,
  getAuditTimestamp,
  getCommonCellSearchText,
  getPeopleAvatarParts,
  getPeopleDetailsParts,
  getPhoneDisplay,
} from "../src/utils/commonCellData";

describe("people and address cell data", () => {
  it("normalizes common person fields and avatar sources", () => {
    expect(getPeopleDetailsParts({ firstName: "  Jane ", lastName: " Doe ", emailAddress: "jane@example.com", mobile: "+14155552671" })).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+14155552671",
    });
    expect(getPeopleDetailsParts({ displayName: "J. Doe", loginName: "j@example.com" }).name).toBe("J. Doe");
    expect(getPeopleDetailsParts(" Plain Name ")).toMatchObject({ name: "Plain Name", email: "", phone: "" });
    expect(getPeopleDetailsParts(17).name).toBe("");
    expect(getPeopleAvatarParts({ firstName: "Jane", avatarUrl: "avatar.png" })).toEqual({ firstName: "Jane", photoUrl: "avatar.png" });
    expect(getPeopleAvatarParts({ name: "Jane Doe" }, { firstName: "Fallback", photo: "row.jpg" })).toEqual({ firstName: "Fallback", photoUrl: "row.jpg" });
    expect(getPeopleAvatarParts(null)).toEqual({ firstName: "", photoUrl: "" });
  });

  it("selects primary addresses and composes address/contact values", () => {
    expect(getAddressParts([
      { street1: "First", city: "A" },
      { isPrimary: true, streetAddress: "100 Main", streetAddress2: "Floor 2", city: "Mumbai", state: "MH", postalCode: "40001", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phoneNumber: "+14155552671" },
    ])).toEqual({
      street: "100 Main, Floor 2",
      cityLine: "Mumbai, MH, 40001",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+14155552671",
    });
    expect(getAddressParts({ street3: "Unit B", country: "Canada", name: "Office" })).toMatchObject({ street: "Unit B", cityLine: "Canada", name: "Office" });
    expect(getAddressParts([]).street).toBe("");
    expect(getAddressParts(null)).toMatchObject({ street: "", cityLine: "" });
  });

  it("formats supported international phones and preserves invalid input", () => {
    expect(getPhoneDisplay("+14155552671").display).toContain("+1");
    expect(getPhoneDisplay("+34943482900").display).toContain("🇪🇸");
    expect(getPhoneDisplay("not a phone")).toEqual({ display: "not a phone", href: "" });
    expect(getPhoneDisplay("123").href).toBe("tel:+1123");
  });
});

describe("audit cell data", () => {
  it("finds the actor in inline values or row metadata", () => {
    expect(getAuditPeopleDetailsParts({ user: { firstName: "Ana", lastName: "Ng", email: "ana@example.com" } })).toMatchObject({ name: "Ana Ng", email: "ana@example.com" });
    expect(getAuditPeopleDetailsParts({}, { updatedByUserInfo: { name: "Editor" } }, "updatedAt").name).toBe("Editor");
    expect(getAuditPeopleDetailsParts({}, { createdBy: "creator@example.com" }, "createdAt").email).toBe("creator@example.com");
    expect(getAuditPeopleDetailsParts({}, { createdUser: "Original Creator" }, "createdAt").name).toBe("Original Creator");
    expect(getAuditPeopleDetailsParts({}, { updatedByName: "Updated By", updatedByEmail: "u@example.com" }, "modifiedAt")).toMatchObject({ name: "Updated By", email: "u@example.com" });
    expect(getAuditPeopleDetailsParts({}, null, "createdAt")).toMatchObject({ name: "", email: "" });
    expect(getAuditPeopleDetailsParts("2026-01-01", { createdByName: "Ignored" }, "createdAt").name).toBe("Ignored");
  });

  it("reads and formats audit timestamps from supported representations", () => {
    const row = { createdAt: "2026-08-25T20:50:00Z", product: { createdAt: "2020-01-01" } };
    expect(getAuditTimestamp({ timestamp: row.createdAt }, row, "createdAt")).toBe(row.createdAt);
    expect(getAuditTimestamp("2026-08-25", {}, "createdAt")).toBe("2026-08-25");
    expect(getAuditTimestamp(null, row, "createdAt")).toBe(row.createdAt);
    expect(getAuditTimestamp(null, { data: { updatedAt: "2026-04-01" } }, "updatedAt")).toBe("2026-04-01");
    expect(getAuditTimestamp(null, {}, "createdAt")).toBeUndefined();
    expect(formatAuditTimestamp("2026-08-25T20:50:00Z")).toContain("25th Aug 2026");
    expect(formatAuditTimestamp("2026,8,25,10,50")).toContain("25th Aug 2026");
    expect(formatAuditTimestamp([2026, 8, 25])).toContain("25th Aug 2026");
    expect(formatAuditTimestamp("invalid", "none")).toBe("none");
    expect(formatAuditTimestamp(new Date("invalid"))).toBe("—");
  });
});

describe("searchable text for predefined cells", () => {
  it("creates type-aware search text for every predefined cell", () => {
    expect(getCommonCellSearchText("peopleDetails", { name: "Jane", email: "j@example.com" })).toContain("Jane | j@example.com");
    expect(getCommonCellSearchText("address", { street1: "Main", city: "NY" })).toContain("Main | NY");
    expect(getCommonCellSearchText("audit", { user: { name: "Editor" }, timestamp: "2026-01-01" }, {}, "audit")).toContain("Editor");
    expect(getCommonCellSearchText("actions", ["View", 2])).toBe("View");
    expect(getCommonCellSearchText("badge", { status: "active" })).toBe("active");
    expect(getCommonCellSearchText("currency", { amount: 5 })).toBe("5");
    expect(getCommonCellSearchText("date", "2026-01-01")).toContain("2026");
    expect(getCommonCellSearchText("dateTime", "invalid")).toBe("");
    expect(getCommonCellSearchText("email", { emailAddress: "j@example.com" })).toBe("j@example.com");
    expect(getCommonCellSearchText("email", " j@example.com ")).toBe("j@example.com");
    expect(getCommonCellSearchText("phone", { phoneNumber: "+123" })).toBe("+123");
    expect(getCommonCellSearchText("phone", 123)).toBe("123");
    expect(getCommonCellSearchText("longText", { a: 1 })).toBe('{"a":1}');
    expect(getCommonCellSearchText("json", { a: 1 })).toBe('{"a":1}');
    expect(getCommonCellSearchText("image", { images: [{ url: "x.jpg", label: "Front" }] })).toContain("Front");
    expect(getCommonCellSearchText("priceBreakdown", { total: 2 })).toBe('{"total":2}');
  });
});
