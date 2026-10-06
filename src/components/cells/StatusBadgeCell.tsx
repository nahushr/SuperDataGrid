import React from "react";
import type {
  SuperDataGridBadgeColor,
  SuperDataGridBadgeOptions,
} from "../../types";
import { asRecord } from "../../utils/predefinedCellData";
import { toSafeText } from "../../utils/safeText";
import styles from "../../styles/predefined-cells.module.css";

const COLOR_CLASSES: Record<SuperDataGridBadgeColor, string> = {
  primary: styles.badgePrimary,
  info: styles.badgeInfo,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  error: styles.badgeError,
  purple: styles.badgePurple,
  neutral: styles.badgeNeutral,
  teal: styles.badgeTeal,
  cyan: styles.badgeCyan,
  indigo: styles.badgeIndigo,
  orange: styles.badgeOrange,
  slate: styles.badgeSlate,
};

const FONT_COLOR_CLASSES: Record<SuperDataGridBadgeColor, string> = {
  primary: styles.badgeFontPrimary,
  info: styles.badgeFontInfo,
  success: styles.badgeFontSuccess,
  warning: styles.badgeFontWarning,
  error: styles.badgeFontError,
  purple: styles.badgeFontPurple,
  neutral: styles.badgeFontNeutral,
  teal: styles.badgeFontTeal,
  cyan: styles.badgeFontCyan,
  indigo: styles.badgeFontIndigo,
  orange: styles.badgeFontOrange,
  slate: styles.badgeFontSlate,
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
}: Readonly<StatusBadgeCellProps>) {
  const record = asRecord(value);
  const raw = record?.status ?? record?.value ?? value;
  const key = toSafeText(raw);
  const label = options.labels?.[key] ?? record?.label ?? (key || options.fallbackLabel);
  let color: SuperDataGridBadgeColor = options.fallbackColor ?? "neutral";
  if (isBadgeColor(record?.color)) color = record.color;
  if (isBadgeColor(options.colors?.[key])) color = options.colors[key];
  const fontColor = isBadgeColor(options.fontColors?.[key])
    ? options.fontColors[key]
    : options.fallbackFontColor;
  const icon = options.icons?.[key] ?? options.fallbackIcon;

  const displayLabel = toSafeText(label ?? options.fallbackLabel).trim();
  if (!displayLabel) {
    return <span className={styles.emptyValue}>—</span>;
  }

  return (
    <span
      className={`${styles.badge} ${COLOR_CLASSES[color]} ${fontColor ? FONT_COLOR_CLASSES[fontColor] : ""}`}
    >
      {icon && <span aria-hidden="true" className={styles.badgeIcon}>{icon}</span>}
      {displayLabel}
    </span>
  );
}
