import type {
  SuperDataGridCurrencyOptions,
  SuperDataGridImageOptions,
  SuperDataGridProductImage,
} from "../types";

export const SUPER_DATA_GRID_PRODUCT_IMAGE_FIELDS = [
  { field: "mainImageUrl", label: "Main" },
  { field: "topImageUrl", label: "Top" },
  { field: "bottomImageUrl", label: "Bottom" },
  { field: "frontImageUrl", label: "Front" },
  { field: "backImageUrl", label: "Back" },
  { field: "rightImageUrl", label: "Right" },
  { field: "leftImageUrl", label: "Left" },
  { field: "detailsImageUrl", label: "Details" },
  { field: "defectImageUrl", label: "Defect" },
  { field: "additionalImage1Url", label: "Additional 1" },
  { field: "additionalImage2Url", label: "Additional 2" },
  { field: "additionalImage3Url", label: "Additional 3" },
] as const;

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
  const currency = record?.currency ?? record?.currencyCode ?? rowCurrency ?? options.currency ?? "USD";
  return typeof currency === "string" && currency.trim()
    ? currency.trim().toUpperCase()
    : "USD";
}

export function getImageParts(
  value: unknown,
  options: SuperDataGridImageOptions = {},
): { src: string; alt: string; label: string } {
  const first = getProductImages(value, options)[0];
  return first
    ? { src: first.url, alt: first.alt, label: first.label ?? "" }
    : {
        src: "",
        alt: options.thumbnailAlt || "Image preview",
        label: "",
      };
}

export function getProductImages(
  value: unknown,
  options: SuperDataGridImageOptions = {},
): Array<SuperDataGridProductImage & { alt: string }> {
  const record = asRecord(value);
  const source = Array.isArray(value)
    ? value
    : Array.isArray(record?.images)
      ? record.images
      : null;
  const result: Array<SuperDataGridProductImage & { alt: string }> = [];
  const seen = new Set<string>();

  const append = (candidate: unknown, fallbackLabel: string) => {
    const imageRecord = asRecord(candidate);
    const url = imageRecord
      ? firstText(imageRecord, ["url", "src", "imageUrl", "image", "photo"])
      : typeof candidate === "string"
        ? candidate.trim()
        : "";
    if (!url || seen.has(url)) return;
    seen.add(url);
    const label = firstText(imageRecord, [options.labelField ?? "label", "label", "name", "title"]) || fallbackLabel;
    const alt = firstText(imageRecord, [options.altField ?? "alt", "alt", "title"]) || label || options.thumbnailAlt || "Product image";
    result.push({ url, label, alt });
  };

  if (source) {
    source.forEach((candidate, index) => append(candidate, `Image ${index + 1}`));
  } else if (record) {
    SUPER_DATA_GRID_PRODUCT_IMAGE_FIELDS.forEach(({ field, label }) => {
      append(record[field], label);
    });
    if (result.length === 0) append(record, "Image");
  } else {
    append(value, "Image");
  }

  return result;
}
