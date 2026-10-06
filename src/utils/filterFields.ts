import type { GridColDef } from "@mui/x-data-grid";
import type {
  SuperDataGridColumnType,
  SuperDataGridFilterField,
  SuperDataGridRow,
} from "../types";
import {
  getAuditPeopleDetailsParts,
  getAuditTimestamp,
  getPeopleDetailsParts,
} from "./commonCellData";
import { toHeaderName } from "./gridData";

export type { SuperDataGridFilterField } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesAtPath(value: unknown, path: string[]): unknown[] {
  if (path.length === 0) {
    return Array.isArray(value)
      ? value.flatMap((entry) => valuesAtPath(entry, []))
      : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => valuesAtPath(entry, path));
  }
  if (!isRecord(value)) return [undefined];
  return valuesAtPath(value[path[0]], path.slice(1));
}

function inferValueType(
  field: string,
  values: readonly unknown[],
): GridColDef["type"] {
  const flatValues = values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value) => value != null);
  if (flatValues.length > 0 && flatValues.every((value) => typeof value === "boolean")) {
    return "boolean";
  }
  if (flatValues.length > 0 && flatValues.every((value) => typeof value === "number")) {
    return "number";
  }
  const allDateValues =
    flatValues.length > 0 &&
    flatValues.every((value) => {
      if (value instanceof Date) return true;
      if (typeof value !== "string") return false;
      const looksIsoDate = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(value);
      return looksIsoDate && !Number.isNaN(Date.parse(value));
    });
  if (
    allDateValues &&
    (/(date|time|at|on|timestamp)$/i.test(field) ||
      flatValues.some((value) => value instanceof Date) ||
      flatValues.some(
        (value) =>
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(value),
      ))
  ) {
    return "date";
  }
  return "string";
}

function nestedLabel(column: GridColDef, nestedPath: string): string {
  const parent = column.headerName ?? toHeaderName(column.field);
  return `${parent} · ${toHeaderName(nestedPath)}`;
}

function discoverNestedPaths(
  values: readonly unknown[],
  parentField: string,
  headerColumn: GridColDef,
  output: SuperDataGridFilterField[],
  pathPrefix: string[] = [],
  depth = 0,
): void {
  if (depth >= 5) return;

  const records = values.flatMap((value) =>
    Array.isArray(value)
      ? value.filter(isRecord)
      : isRecord(value)
        ? [value]
        : [],
  );
  const keys = new Set(records.flatMap((record) => Object.keys(record)));

  for (const key of keys) {
    const childValues = records.map((record) => record[key]);
    const currentPath = [...pathPrefix, key];
    const hasObjects = childValues.some(
      (value) =>
        isRecord(value) || (Array.isArray(value) && value.some(isRecord)),
    );

    if (hasObjects) {
      discoverNestedPaths(
        childValues,
        parentField,
        headerColumn,
        output,
        currentPath,
        depth + 1,
      );
      continue;
    }

    output.push({
      field: `${parentField}.${currentPath.join(".")}`,
      headerName: nestedLabel(headerColumn, currentPath.join(" ")),
      type: inferValueType(key, childValues),
      parentField,
      nestedPath: currentPath.join("."),
    });
  }
}

/** Builds filter-only fields from nested raw row data without exposing them as grid columns. */
export function createFilterFields(
  columns: readonly GridColDef[],
  data: readonly SuperDataGridRow[],
  columnTypes?: Partial<Record<string, SuperDataGridColumnType>>,
): SuperDataGridFilterField[] {
  const fields: SuperDataGridFilterField[] = columns
    .filter((column) => column.filterable !== false)
    .map((column) => ({
      field: column.field,
      headerName: column.headerName ?? toHeaderName(column.field),
      type: column.type,
    }));

  for (const column of columns) {
    if (
      column.filterable === false ||
      columnTypes?.[column.field] === "actions"
    ) {
      continue;
    }

    const columnType = columnTypes?.[column.field];
    const rowRecords = data.map((row) => row as Record<string, unknown>);

    if (columnType === "audit") {
      const auditParts = [
        ["fullName", "string"],
        ["email", "string"],
        ["timestamp", "date"],
      ] as const;
      for (const [part, type] of auditParts) {
        fields.push({
          field: `${column.field}.${part}`,
          headerName: nestedLabel(column, part),
          type,
          parentField: column.field,
          nestedPath: part,
        });
      }
    }

    const rawValues = rowRecords.map((row) => row[column.field]);
    const beforeDiscovery = fields.length;
    discoverNestedPaths(rawValues, column.field, column, fields);

    if (
      columnType === "peopleDetails" &&
      !fields.some((field) => field.field === `${column.field}.name`) &&
      fields.length > beforeDiscovery
    ) {
      fields.push({
        field: `${column.field}.name`,
        headerName: nestedLabel(column, "name"),
        type: "string",
        parentField: column.field,
        nestedPath: "name",
      });
    }
  }

  return fields.filter(
    (field, index) =>
      fields.findIndex((candidate) => candidate.field === field.field) === index,
  );
}

/** Resolves a filter-only nested field against the unformatted row data. */
export function getFilterFieldValue(
  row: Record<string, unknown>,
  field: SuperDataGridFilterField,
  columnTypes?: Partial<Record<string, SuperDataGridColumnType>>,
): unknown {
  if (field.parentField == null || field.nestedPath == null) {
    return row[field.field];
  }

  const columnType = columnTypes?.[field.parentField];
  const rawValue = row[field.parentField];
  if (columnType === "peopleDetails" && field.nestedPath === "name") {
    return getPeopleDetailsParts(rawValue).name;
  }
  if (columnType === "audit") {
    if (field.nestedPath === "fullName") {
      return getAuditPeopleDetailsParts(rawValue, row, field.parentField).name;
    }
    if (field.nestedPath === "email") {
      return getAuditPeopleDetailsParts(rawValue, row, field.parentField).email;
    }
    if (field.nestedPath === "timestamp") {
      return getAuditTimestamp(rawValue, row, field.parentField);
    }
  }

  const values = valuesAtPath(rawValue, field.nestedPath.split("."))
    .filter((value) => value != null)
    .map((value) => value);
  return values.length === 1 ? values[0] : values;
}
