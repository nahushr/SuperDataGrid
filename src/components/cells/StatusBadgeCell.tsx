import React from "react";
import type {
  SuperDataGridBadgeColor,
  SuperDataGridBadgeOptions,
} from "../../types";
import { asRecord } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

const COLOR_CLASSES: Record<SuperDataGridBadgeColor, string> = {
  primary: styles.badgePrimary,
  info: styles.badgeInfo,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  error: styles.badgeError,
  purple: styles.badgePurple,
  neutral: styles.badgeNeutral,
};

interface StatusBadgeCellProps {
  value: unknown;
  options?: SuperDataGridBadgeOptions;
}

function isBadgeColor(value: unknown): value is SuperDataGridBadgeColor {
  return typeof value === "string" && value in COLOR_CLASSES;
}

export default function StatusBadgeCell({
  value,
  options = {},
}: StatusBadgeCellProps) {
  const record = asRecord(value);
  const raw = record?.status ?? record?.value ?? value;
  const key = raw == null ? "" : String(raw);
  const label = options.labels?.[key] ?? record?.label ?? (key || options.fallbackLabel);
  const color = isBadgeColor(options.colors?.[key])
    ? options.colors[key]
    : isBadgeColor(record?.color)
      ? record.color
      : options.fallbackColor ?? "neutral";

  const displayLabel = String(label ?? options.fallbackLabel ?? "").trim();
  if (!displayLabel) {
    return <span className={styles.emptyValue}>—</span>;
  }

  return (
    <span className={`${styles.badge} ${COLOR_CLASSES[color]}`}>
      {displayLabel}
    </span>
  );
}
