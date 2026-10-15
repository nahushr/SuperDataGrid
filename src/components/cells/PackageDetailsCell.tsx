import React from "react";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import type { SuperDataGridPackageDetailsOptions } from "../../types";
import styles from "../../styles/predefined-cells.module.css";

interface PackageDetailsCellProps {
  row: Readonly<Record<string, unknown>>;
  options?: SuperDataGridPackageDetailsOptions;
}

const PACKAGE_TYPE_TONES: Record<string, string> = {
  STANDARD: styles.packageTypeCyan,
  FRAGILE: styles.packageTypeAmber,
  OVERSIZED: styles.packageTypePurple,
  ENVELOPE: styles.packageTypeTeal,
  BOX: styles.packageTypeBlue,
  TUBE: styles.packageTypeIndigo,
  CUSTOM: styles.packageTypeSlate,
};

function packageRecord(row: Readonly<Record<string, unknown>>) {
  const nested = row._package;
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : row;
}

function displayType(value: unknown, labels: Readonly<Record<string, string>> = {}) {
  const raw = displayText(value);
  if (!raw) return "";
  const normalized = raw.toUpperCase();
  return labels[normalized] ?? normalized.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : "";
}

export default function PackageDetailsCell({
  row,
  options = {},
}: Readonly<PackageDetailsCellProps>) {
  const record = packageRecord(row);
  const name = displayText(record.packageName ?? row.packageName);
  const type = displayType(record.packageType ?? row.packageType, options.typeLabels);
  const length = record.length ?? row.length;
  const width = record.breadth ?? record.width ?? row.breadth ?? row.width;
  const height = record.height ?? row.height;
  const hasDimensions = length != null || width != null || height != null;
  const dimensions = hasDimensions
    ? [length, width, height].map((value) => value == null ? "—" : displayText(value)).join(" × ")
    : "";
  const typeTone = PACKAGE_TYPE_TONES[String(record.packageType ?? row.packageType ?? "").toUpperCase()] ?? styles.packageTypeSlate;

  if (!name && !type && !dimensions) return <span className={styles.emptyValue}>—</span>;

  return (
    <div className={styles.packageDetails}>
      <div className={styles.packageDetailsNameRow}>
        <Inventory2OutlinedIcon aria-hidden="true" className={styles.packageDetailsIcon} />
        <span className={styles.packageDetailsName} title={name}>{name || "Unnamed package"}</span>
      </div>
      {type && <span className={`${styles.packageTypeBadge} ${typeTone}`}>{type}</span>}
      {dimensions && (
        <span className={styles.packageDimensions}>
          <StraightenOutlinedIcon aria-hidden="true" className={styles.packageDetailsMetaIcon} />
          <span>Dims: {dimensions} {options.dimensionUnit ?? "cm"}</span>
        </span>
      )}
    </div>
  );
}
