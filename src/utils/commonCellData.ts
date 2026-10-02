import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

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
  const inlineParts = isDateValue(person ?? value)
    ? { name: "", email: "", phone: "" }
    : getPeopleDetailsParts(person ?? value);
  if (inlineParts.name || inlineParts.email || inlineParts.phone) {
    return inlineParts;
  }

  const rowRecord = toRecord(row);
  if (rowRecord == null) return { name: "", email: "", phone: "" };

  const normalizedField = field.toLowerCase();
  const peopleKeys =
    normalizedField.includes("updated") || normalizedField.includes("modified")
      ? [
          "updatedByUserInfo",
          "modifiedByUserInfo",
          "updatedByUser",
          "modifiedByUser",
          "updatedBy",
          "modifiedBy",
        ]
      : normalizedField.includes("created")
        ? ["createdByUserInfo", "createdByUser", "createdBy", "creator"]
        : [
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

  for (const key of peopleKeys) {
    const candidate = rowRecord[key];
    if (typeof candidate === "string" && candidate.includes("@")) {
      return { name: "", email: candidate.trim(), phone: "" };
    }

    const parts = getPeopleDetailsParts(candidate);
    if (parts.name || parts.email || parts.phone) return parts;
  }

  const namePrefix =
    normalizedField.includes("updated") || normalizedField.includes("modified")
      ? "updated"
      : "created";
  const actorFallback =
    namePrefix === "created" ? rowRecord.createdUser : undefined;
  const actorText =
    typeof actorFallback === "string" ? actorFallback.trim() : "";
  const actorIsEmail = actorText.includes("@");
  const name =
    firstText(rowRecord, [
      `${namePrefix}ByName`,
      `${namePrefix}ByFullName`,
      `${namePrefix}UserName`,
    ]) || (actorText && !actorIsEmail ? actorText : "");
  const email =
    firstText(rowRecord, [
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
  type: "peopleDetails" | "address" | "audit" | "actions",
  value: unknown,
  row?: unknown,
  field?: string,
): string {
  if (type === "audit") {
    const person = getAuditPeopleDetailsParts(value, row, field);
    const timestamp = formatAuditTimestamp(
      getAuditTimestamp(value, row, field ?? ""),
    );
    return [person.name, person.email, timestamp].filter(Boolean).join(" | ");
  }
  if (type === "actions") {
    return Array.isArray(value)
      ? value.filter((action): action is string => typeof action === "string").join(" | ")
      : "";
  }

  const parts = type === "peopleDetails" ? getPeopleDetailsParts(value) : getAddressParts(value);
  return Object.values(parts).filter(Boolean).join(" | ");
}

function parseAuditDate(value: unknown): Date | null {
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    date = new Date(value);
  } else if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    const jacksonDate = /^\d{4},\d{1,2},\d{1,2}(?:,.*)?$/.test(trimmed);
    if (jacksonDate) {
      const parts = trimmed.split(",").map((part) => Number(part.trim()));
      if (parts.length >= 3 && parts.every(Number.isFinite)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
        date = new Date(year, month - 1, day, hour, minute, second);
      }
    } else {
      date = new Date(trimmed);
    }
  } else if (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every((part) => typeof part === "number" && Number.isFinite(part))
  ) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    date = new Date(year, month - 1, day, hour, minute, second);
  }

  return date != null && !Number.isNaN(date.getTime()) ? date : null;
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
  const normalizedField = field.toLowerCase();
  const timestampKeys = normalizedField.includes("created")
    ? ["createdAt", "createdOn", "created", "timestamp", "dateTime"]
    : normalizedField.includes("updated") || normalizedField.includes("modified")
      ? [
          "updatedAt",
          "modifiedAt",
          "updatedOn",
          "modifiedOn",
          "timestamp",
          "dateTime",
        ]
      : [
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

  for (const key of timestampKeys) {
    if (isDateValue(record[key])) return record[key];
  }

  const nestedRecords = [record.product, record.entity, record.data]
    .map(toRecord)
    .filter((nested): nested is Record<string, unknown> => nested != null);
  for (const nested of nestedRecords) {
    for (const key of timestampKeys) {
      if (isDateValue(nested[key])) return nested[key];
    }
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
  let formattedDigits = digits;
  if (digits.length === 10) {
    formattedDigits = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 6) {
    formattedDigits = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return {
    display: `${countryFlag(country)} +${phone.countryCallingCode} ${formattedDigits}`,
    href: `tel:${phone.number}`,
  };
}
