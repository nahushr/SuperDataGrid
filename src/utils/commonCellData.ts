import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import type { SuperDataGridColumnType } from "../types";
import { getProductImages } from "./predefinedCellData";
import { toSafeText } from "./safeText";

export interface PeopleDetailsParts {
  name: string;
  email: string;
  phone: string;
}

export interface PeopleAvatarParts {
  firstName: string;
  photoUrl: string;
}

export interface AddressParts extends PeopleDetailsParts {
  street: string;
  cityLine: string;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstText(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
}

export function getPeopleDetailsParts(value: unknown): PeopleDetailsParts {
  const record = toRecord(value);
  if (record == null) {
    return {
      name: typeof value === "string" ? value.trim() : "",
      email: "",
      phone: "",
    };
  }

  const splitName = [record.firstName, record.lastName]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .map((part) => part.trim())
    .join(" ");

  return {
    name:
      splitName ||
      firstText(record, ["name", "fullName", "displayName", "userName"]),
    email: firstText(record, ["email", "emailAddress", "loginName"]),
    phone: firstText(record, ["phone", "phoneNumber", "mobile"]),
  };
}

export function getPeopleAvatarParts(
  value: unknown,
  row?: unknown,
): PeopleAvatarParts {
  const record = toRecord(value);
  const rowRecord = toRecord(row);
  const photoKeys = [
    "photo",
    "photoUrl",
    "photoURL",
    "avatar",
    "avatarUrl",
    "avatarURL",
    "image",
    "imageUrl",
    "imageURL",
    "profilePicture",
    "profilePictureUrl",
    "profilePhoto",
  ];
  const name = getPeopleDetailsParts(value).name;

  return {
    firstName:
      firstText(record ?? {}, ["firstName"]) ||
      firstText(rowRecord ?? {}, ["firstName"]) ||
      name.split(/\s+/)[0] ||
      "",
    photoUrl:
      firstText(record ?? {}, photoKeys) ||
      firstText(rowRecord ?? {}, photoKeys),
  };
}

export function getAuditPeopleDetailsParts(
  value: unknown,
  row?: unknown,
  field = "",
): PeopleDetailsParts {
  const record = toRecord(value);
  const person = record?.user ?? record?.person ?? record?.createdByUserInfo;
  if (!isDateValue(person ?? value)) {
    const inlineParts = getPeopleDetailsParts(person ?? value);
    if (inlineParts.name || inlineParts.email || inlineParts.phone) {
      return inlineParts;
    }
  }

  const rowRecord = toRecord(row);
  if (rowRecord == null) return { name: "", email: "", phone: "" };

  const normalizedField = field.toLowerCase();
  const auditPerson = findAuditPerson(rowRecord, getAuditPersonKeys(normalizedField));
  if (auditPerson) return auditPerson;

  const actorPrefix = getAuditActorPrefix(normalizedField);
  return getAuditActorFallback(rowRecord, actorPrefix);
}

function getAuditPersonKeys(normalizedField: string): readonly string[] {
  if (normalizedField.includes("updated") || normalizedField.includes("modified")) {
    return [
      "updatedByUserInfo",
      "modifiedByUserInfo",
      "updatedByUser",
      "modifiedByUser",
      "updatedBy",
      "modifiedBy",
    ];
  }
  if (normalizedField.includes("created")) {
    return ["createdByUserInfo", "createdByUser", "createdBy", "creator"];
  }
  return [
    "createdByUserInfo",
    "updatedByUserInfo",
    "modifiedByUserInfo",
    "createdByUser",
    "updatedByUser",
    "modifiedByUser",
    "userInfo",
    "user",
    "createdBy",
    "updatedBy",
    "modifiedBy",
    "actor",
    "auditUser",
  ];
}

function findAuditPerson(
  row: Record<string, unknown>,
  keys: readonly string[],
): PeopleDetailsParts | null {
  for (const key of keys) {
    const candidate = row[key];
    if (typeof candidate === "string" && candidate.includes("@")) {
      return { name: "", email: candidate.trim(), phone: "" };
    }
    const parts = getPeopleDetailsParts(candidate);
    if (parts.name || parts.email || parts.phone) return parts;
  }
  return null;
}

function getAuditActorPrefix(normalizedField: string): "created" | "updated" {
  return normalizedField.includes("updated") || normalizedField.includes("modified")
    ? "updated"
    : "created";
}

function getAuditActorFallback(
  row: Record<string, unknown>,
  namePrefix: "created" | "updated",
): PeopleDetailsParts {
  const actorFallback = namePrefix === "created" ? row.createdUser : undefined;
  const actorText =
    typeof actorFallback === "string" ? actorFallback.trim() : "";
  const actorIsEmail = actorText.includes("@");
  const name =
    firstText(row, [
      `${namePrefix}ByName`,
      `${namePrefix}ByFullName`,
      `${namePrefix}UserName`,
    ]) || (actorText && !actorIsEmail ? actorText : "");
  const email =
    firstText(row, [
      `${namePrefix}ByEmail`,
      `${namePrefix}ByLoginName`,
    ]) || (actorIsEmail ? actorText : "");

  return { name, email, phone: "" };
}

function getPrimaryAddress(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    const addresses = value.map(toRecord).filter(
      (address): address is Record<string, unknown> => address != null,
    );
    return addresses.find((address) => address.isPrimary === true) ?? addresses[0] ?? null;
  }
  return toRecord(value);
}

export function getAddressParts(value: unknown): AddressParts {
  const address = getPrimaryAddress(value);
  if (address == null) {
    return { street: "", cityLine: "", name: "", email: "", phone: "" };
  }

  const street = [
    firstText(address, ["streetAddress", "street1"]),
    firstText(address, ["streetAddress2", "street2"]),
    firstText(address, ["streetAddress3", "street3"]),
  ]
    .filter(Boolean)
    .join(", ");
  const cityLine = [
    firstText(address, ["city"]),
    firstText(address, ["state"]),
    firstText(address, ["postalCode", "zipCode"]),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    street,
    cityLine: cityLine || firstText(address, ["country"]),
    name:
      [address.firstName, address.lastName]
        .filter(
          (part): part is string =>
            typeof part === "string" && Boolean(part.trim()),
        )
        .map((part) => part.trim())
        .join(" ") ||
      firstText(address, ["nameOnAddress", "name", "fullName"]),
    email: firstText(address, ["emailOnAddress", "email", "emailAddress"]),
    phone: firstText(address, ["phoneOnAddress", "phone", "phoneNumber"]),
  };
}

export function getCommonCellSearchText(
  type: SuperDataGridColumnType,
  value: unknown,
  row?: unknown,
  field?: string,
): string {
  switch (type) {
    case "audit":
      return getAuditSearchText(value, row, field ?? "");
    case "actions":
      return Array.isArray(value)
        ? value.filter((action): action is string => typeof action === "string").join(" | ")
        : "";
    case "badge": {
      const record = toRecord(value);
      return toSafeText(record?.status ?? record?.value ?? record?.label ?? value);
    }
    case "currency": {
      const record = toRecord(value);
      return toSafeText(record?.amount ?? record?.value ?? value);
    }
    case "date":
    case "dateTime": {
      const date = parseAuditDate(value);
      return date?.toISOString() ?? "";
    }
    case "email":
      return getEmailSearchText(value);
    case "phone":
      return getPhoneSearchText(value);
    case "longText":
    case "json":
    case "priceBreakdown":
      return toSafeText(value);
    case "image":
      return getImageSearchText(value);
    case "peopleDetails":
      return Object.values(getPeopleDetailsParts(value)).filter(Boolean).join(" | ");
    case "address":
      return Object.values(getAddressParts(value)).filter(Boolean).join(" | ");
    default:
      return "";
  }
}

function getAuditSearchText(value: unknown, row: unknown, field: string): string {
  const person = getAuditPeopleDetailsParts(value, row, field);
  const timestamp = formatAuditTimestamp(getAuditTimestamp(value, row, field));
  return [person.name, person.email, timestamp].filter(Boolean).join(" | ");
}

function getEmailSearchText(value: unknown): string {
  const record = toRecord(value);
  return firstText(record ?? {}, ["email", "emailAddress", "value"]) ||
    (typeof value === "string" ? value.trim() : "");
}

function getPhoneSearchText(value: unknown): string {
  const record = toRecord(value);
  return firstText(record ?? {}, ["phone", "phoneNumber", "mobile", "value"]) ||
    (typeof value === "string" || typeof value === "number" ? toSafeText(value) : "");
}

function getImageSearchText(value: unknown): string {
  return getProductImages(value)
    .flatMap((image) => [image.label, image.alt, image.url])
    .filter(Boolean)
    .join(" | ");
}

function validDate(date: Date | null): Date | null {
  return date != null && !Number.isNaN(date.getTime()) ? date : null;
}

function dateFromParts(parts: readonly number[]): Date | null {
  if (parts.length < 3 || !parts.every(Number.isFinite)) return null;
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
  return validDate(new Date(year, month - 1, day, hour, minute, second));
}

function parseDateString(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4},\d{1,2},\d{1,2}(?:,.*)?$/.test(trimmed)) {
    return validDate(new Date(trimmed));
  }
  const parts = trimmed.split(",").map((part) => Number(part.trim()));
  return dateFromParts(parts);
}

function parseAuditDate(value: unknown): Date | null {
  if (value instanceof Date) return validDate(value);
  if (typeof value === "number" && Number.isFinite(value)) {
    return validDate(new Date(value));
  }
  if (typeof value === "string") return parseDateString(value);
  if (Array.isArray(value) && value.every((part) => typeof part === "number")) {
    return dateFromParts(value as number[]);
  }
  return null;
}

function isDateValue(value: unknown): boolean {
  return parseAuditDate(value) != null;
}

export function getAuditTimestamp(
  value: unknown,
  row: unknown,
  field: string,
): unknown {
  const inline = toRecord(value);
  const inlineTimestamp = [
    inline?.timestamp,
    inline?.timeStamp,
    inline?.dateTime,
    inline?.createdAt,
    inline?.createdOn,
    inline?.updatedAt,
    inline?.updatedOn,
    inline?.modifiedAt,
    inline?.modifiedOn,
    inline?.created,
  ].find(isDateValue);
  if (inlineTimestamp != null) return inlineTimestamp;
  if (isDateValue(value)) return value;

  const record = toRecord(row);
  if (record == null) return undefined;
  const timestampKeys = getAuditTimestampKeys(field.toLowerCase());
  const directTimestamp = findAuditTimestamp(record, timestampKeys);
  if (directTimestamp != null) return directTimestamp;
  return findNestedAuditTimestamp(record, timestampKeys);
}

function getAuditTimestampKeys(normalizedField: string): readonly string[] {
  if (normalizedField.includes("created")) {
    return ["createdAt", "createdOn", "created", "timestamp", "dateTime"];
  }
  if (normalizedField.includes("updated") || normalizedField.includes("modified")) {
    return ["updatedAt", "modifiedAt", "updatedOn", "modifiedOn", "timestamp", "dateTime"];
  }
  return [
    "createdAt",
    "createdOn",
    "created",
    "updatedAt",
    "updatedOn",
    "modifiedAt",
    "modifiedOn",
    "timestamp",
    "timeStamp",
    "dateTime",
  ];
}

function findAuditTimestamp(
  record: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    if (isDateValue(record[key])) return record[key];
  }
  return undefined;
}

function findNestedAuditTimestamp(
  record: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of ["product", "entity", "data"] as const) {
    const nested = toRecord(record[key]);
    if (nested == null) continue;
    const timestamp = findAuditTimestamp(nested, keys);
    if (timestamp != null) return timestamp;
  }
  return undefined;
}

function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatAuditTimestamp(value: unknown, emptyText = "—"): string {
  const date = parseAuditDate(value);
  if (date == null) return emptyText;

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const day = Number(part("day"));

  return `${day}${ordinalSuffix(day)} ${part("month")} ${part("year")}, ${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()} UTC`;
}

function countryFlag(countryCode: CountryCode): string {
  return countryCode
    .split("")
    .map((character) =>
      String.fromCodePoint(127397 + (character.codePointAt(0) ?? 0)),
    )
    .join("");
}

export function getPhoneDisplay(value: string): {
  display: string;
  href: string;
} {
  const phone = parsePhoneNumberFromString(value, "US");
  if (phone == null) {
    const digits = value.replace(/\D/g, "");
    return { display: value, href: digits ? `tel:${value}` : "" };
  }

  const country = phone.country ?? "US";
  const digits = phone.nationalNumber.slice(0, 10);
  const formattedDigits = formatMaskedPhoneNumber(digits) ?? digits;

  return {
    display: `${countryFlag(country)} +${phone.countryCallingCode} ${formattedDigits}`,
    href: `tel:${phone.number}`,
  };
}

export function formatMaskedPhoneNumber(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 9 && digits.length !== 10) return undefined;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
