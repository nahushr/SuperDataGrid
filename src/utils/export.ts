import type { SuperDataGridExportFormat } from "../types";

export type ExportFormat = SuperDataGridExportFormat;

export interface ExportColumn {
  field: string;
  headerName?: string;
}

function downloadBlobFile(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string,
) {
  downloadBlobFile(new Blob([content], { type: mimeType }), fileName);
}

export function quoteSqlIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function toSqlValue(value: unknown): string {
  if (value == null) return "NULL";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? "NULL"
      : `'${value.toISOString()}'`;
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  const text =
    typeof value === "object" ? JSON.stringify(value) ?? "" : String(value);
  return `'${text.replace(/'/g, "''")}'`;
}

function toExportText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
}

function toSpreadsheetValue(value: unknown): string | number | boolean | Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }
  return JSON.stringify(value) ?? String(value);
}

function quoteCsvValue(value: unknown): string {
  const text = toExportText(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportGridData(
  format: ExportFormat,
  columns: readonly ExportColumn[],
  rows: readonly Record<string, unknown>[],
  fileName: string,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) return;

  if (format === "xlsx") {
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    if (signal?.aborted) return;
    const sheetData = [
      columns.map((column) => ({
        value: column.headerName ?? column.field,
        fontWeight: "bold" as const,
      })),
      ...rows.map((row) =>
        columns.map((column) => toSpreadsheetValue(row[column.field])),
      ),
    ];
    const workbook = await writeExcelFile(sheetData, {
      sheet: "Data",
      columns: columns.map((column) => ({
        width: Math.min(
          40,
          Math.max(12, (column.headerName ?? column.field).length + 2),
        ),
      })),
    }).toBlob();
    if (signal?.aborted) return;
    downloadBlobFile(workbook, `${fileName}.xlsx`);
    return;
  }

  if (format === "json") {
    downloadTextFile(
      JSON.stringify(rows, null, 2),
      `${fileName}.json`,
      "application/json;charset=utf-8",
    );
    return;
  }

  if (format === "csv") {
    const header = columns.map((column) => quoteCsvValue(column.headerName ?? column.field));
    const csvRows = rows.map((row) =>
      columns.map((column) => quoteCsvValue(row[column.field])),
    );
    const csv = [header, ...csvRows].map((row) => row.join(",")).join("\r\n");
    downloadTextFile(`\uFEFF${csv}\r\n`, `${fileName}.csv`, "text/csv;charset=utf-8");
    return;
  }

  const fieldList = columns
    .map((column) => quoteSqlIdentifier(column.field))
    .join(", ");
  const statements = rows.map((row) => {
    const values = columns
      .map((column) => toSqlValue(row[column.field]))
      .join(", ");
    return `INSERT INTO "super_data_grid" (${fieldList}) VALUES (${values});`;
  });
  downloadTextFile(
    statements.length > 0
      ? `${statements.join("\n")}\n`
      : "-- No rows to export.\n",
    `${fileName}.sql`,
    "text/plain;charset=utf-8",
  );
}
