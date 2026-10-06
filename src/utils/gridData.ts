import type {
  GridColDef,
  GridRowId,
} from "@mui/x-data-grid";
import type { SuperDataGridRow } from "../types";
import { toSafeText } from "./safeText";

export function toHeaderName(field: string): string {
  const words = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim();

  return words ? words[0].toUpperCase() + words.slice(1) : field;
}

export function getColumnHeaderHeight(columns: readonly GridColDef[]): number {
  const maxLines = columns.reduce((max, column) => {
    const title = column.headerName ?? column.field;
    return Math.max(max, Math.ceil(title.length / 16));
  }, 1);

  return Math.max(72, maxLines * 20 + 24);
}

export function toDisplayValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toLocaleDateString();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return toSafeText(value);
  }

  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}

export function inferColumnType(
  field: string,
  data: readonly SuperDataGridRow[],
): GridColDef["type"] | undefined {
  const values = data
    .map((row) => (row as Record<string, unknown>)[field])
    .filter((value) => value != null);

  if (values.length === 0) return undefined;
  if (values.every((value) => typeof value === "boolean")) return "boolean";
  if (values.every((value) => typeof value === "number")) return "number";
  if (values.every((value) => value instanceof Date)) return "date";

  const isDateNamedField = /(date|time|createdAt|updatedAt|lastLoginAt)$/i.test(
    field,
  );
  if (
    isDateNamedField &&
    values.every(
      (value) =>
        typeof value === "string" && !Number.isNaN(Date.parse(value)),
    )
  ) {
    return "date";
  }

  return "string";
}

export function isGridRowId(value: unknown): value is GridRowId {
  return typeof value === "string" || typeof value === "number";
}
