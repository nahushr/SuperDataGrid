import type { SuperDataGridCurrencyOptions } from "../types";

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function firstText(value: unknown, keys: readonly string[]): string {
  const record = asRecord(value);
  if (!record) return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" || typeof candidate === "number") {
      const text = String(candidate).trim();
      if (text) return text;
    }
  }
  return "";
}

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const record = asRecord(value);
  const candidate = record
    ? record.date ?? record.dateTime ?? record.timestamp ?? record.value
    : value;
  const date = candidate instanceof Date
    ? candidate
    : typeof candidate === "number" || typeof candidate === "string"
      ? new Date(candidate)
      : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function getCurrencyAmount(
  value: unknown,
  options: SuperDataGridCurrencyOptions = {},
): number | null {
  const record = asRecord(value);
  const rawAmount = record?.amount ?? record?.value ?? value;
  const amount = typeof rawAmount === "number"
    ? rawAmount
    : typeof rawAmount === "string" && rawAmount.trim()
      ? Number(rawAmount.replace(/,/g, ""))
      : Number.NaN;
  if (!Number.isFinite(amount)) return null;

  const amountInMinorUnits =
    record?.amountInMinorUnits === true ||
    options.amountInMinorUnits === true;
  const minorUnits = Number.isInteger(record?.minorUnits)
    ? Number(record?.minorUnits)
    : options.minorUnits ?? 2;
  return amountInMinorUnits ? amount / 10 ** minorUnits : amount;
}

export function getCurrencyCode(
  value: unknown,
  options: SuperDataGridCurrencyOptions = {},
  row?: unknown,
): string {
  const record = asRecord(value);
  const rowRecord = asRecord(row);
  const rowCurrency = options.currencyField
    ? rowRecord?.[options.currencyField]
    : undefined;
  const currency = record?.currency ?? rowCurrency ?? options.currency ?? "USD";
  return typeof currency === "string" && currency.trim()
    ? currency.trim().toUpperCase()
    : "USD";
}

export function getImageParts(
  value: unknown,
  options: { altField?: string; labelField?: string; thumbnailAlt?: string } = {},
): { src: string; alt: string; label: string } {
  const record = asRecord(value);
  const src = firstText(record, ["src", "url", "imageUrl", "image", "photo"]);
  const alt = firstText(record, [options.altField ?? "alt", "alt", "title"]);
  const label = firstText(record, [options.labelField ?? "label", "name", "title"]);
  return {
    src: record ? src : typeof value === "string" ? value.trim() : "",
    alt: alt || label || options.thumbnailAlt || "Image preview",
    label,
  };
}
