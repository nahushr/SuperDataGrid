import React from "react";
import type { SuperDataGridRow } from "../../types";
import styles from "../../styles/predefined-cells.module.css";

interface PackageWeightCellProps {
  row: SuperDataGridRow;
  field: string;
}

export default function PackageWeightCell({
  row,
  field,
}: Readonly<PackageWeightCellProps>) {
  const record = row as Record<string, unknown>;
  const nested = record._package;
  const packageRecord = nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : record;
  const value = record[field] ?? packageRecord[field];
  const numeric = typeof value === "number" ? value : Number(value);

  if (value == null || value === "" || !Number.isFinite(numeric)) {
    return <span className={styles.emptyValue}>—</span>;
  }

  return (
    <span className={styles.packageWeight}>
      <span className={styles.packageWeightValue}>{new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(numeric)}</span>
      <span className={styles.packageWeightUnit}>kg</span>
    </span>
  );
}
