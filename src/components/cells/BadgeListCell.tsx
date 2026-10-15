import React from "react";
import GridChip, { type GridChipTone } from "../GridChip";
import type {
  SuperDataGridBadgeColor,
  SuperDataGridBadgeListOptions,
} from "../../types";
import styles from "../../styles/predefined-cells.module.css";

interface BadgeListCellProps {
  value: unknown;
  options?: SuperDataGridBadgeListOptions;
  row: Readonly<Record<string, unknown>>;
}

const COLOR_CLASSES: Record<SuperDataGridBadgeColor, string> = {
  primary: styles.listChipCyan,
  info: styles.listChipBlue,
  success: styles.listChipGreen,
  warning: styles.listChipAmber,
  error: styles.listChipRose,
  purple: styles.listChipPurple,
  neutral: styles.listChipSlate,
  teal: styles.listChipTeal,
  cyan: styles.listChipCyan,
  indigo: styles.listChipBlue,
  orange: styles.listChipAmber,
  slate: styles.listChipSlate,
};

const GRID_CHIP_TONES: Record<SuperDataGridBadgeColor, GridChipTone> = {
  primary: "cyan",
  info: "blue",
  success: "green",
  warning: "amber",
  error: "rose",
  purple: "purple",
  neutral: "slate",
  teal: "teal",
  cyan: "cyan",
  indigo: "blue",
  orange: "amber",
  slate: "slate",
};

function getLabel(item: unknown, labelField?: string): string {
  if (typeof item === "string" || typeof item === "number") {
    return String(item).trim();
  }
  if (typeof item !== "object" || item === null || Array.isArray(item)) return "";

  const record = item as Record<string, unknown>;
  const candidates = [labelField, "name", "label", "value", "locationName", "id"]
    .filter((candidate): candidate is string => Boolean(candidate));
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
}

function getText(item: unknown, field?: string): string | undefined {
  if (!field || typeof item !== "object" || item === null || Array.isArray(item)) {
    return undefined;
  }
  const candidate = (item as Record<string, unknown>)[field];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : undefined;
}

function getCustomColorStyle(color: unknown): React.CSSProperties | undefined {
  if (typeof color !== "string" || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color.trim())) {
    return undefined;
  }

  const hex = color.trim().slice(1);
  const normalizedHex = hex.length === 3
    ? hex.split("").map((channel) => `${channel}${channel}`).join("")
    : hex;
  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(normalizedHex.slice(offset, offset + 2), 16) / 255,
  );
  const luminance = channels.reduce(
    (total, channel, index) =>
      total +
      (channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4) *
        [0.2126, 0.7152, 0.0722][index],
    0,
  );

  return {
    backgroundColor: `#${normalizedHex}`,
    color: luminance > 0.45 ? "#172033" : "#FFFFFF",
    borderColor: `#${normalizedHex}`,
  };
}

export default function BadgeListCell({ value, options = {}, row }: Readonly<BadgeListCellProps>) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\s*[|,]\s*/).filter(Boolean)
      : value == null
        ? []
        : [value];
  const badges = items
    .map((item) => ({ item, label: getLabel(item, options.labelField) }))
    .filter(({ label }) => label.length > 0);

  if (badges.length === 0) return <span className={styles.emptyValue}>—</span>;

  const maxItems = options.maxItems ?? 4;
  const visible = badges.slice(0, maxItems);
  const remainder = badges.length - visible.length;

  return (
    <div className={styles.badgeList}>
      {visible.map(({ item, label }, index) => {
        const title = getText(item, options.titleField ?? "description");
        const candidateColor =
          typeof item === "object" && item !== null && !Array.isArray(item)
            ? (item as Record<string, unknown>).color
            : undefined;
        const hasNamedColor = typeof candidateColor === "string" && candidateColor in COLOR_CLASSES;
        const customColorStyle = hasNamedColor ? undefined : getCustomColorStyle(candidateColor);
        const color = hasNamedColor
          ? candidateColor as SuperDataGridBadgeColor
          : options.color ?? "cyan";
        return options.onItemClick ? (
          <GridChip
            key={`${label}-${index}`}
            label={label}
            tone={GRID_CHIP_TONES[color]}
            title={title}
            style={customColorStyle}
            onClick={() => options.onItemClick?.(item, row)}
          />
        ) : (
          <span
            className={`${styles.listChip} ${COLOR_CLASSES[color]}`}
            key={`${label}-${index}`}
            title={title}
            style={customColorStyle}
          >
            {label}
          </span>
        );
      })}
      {remainder > 0 && (
        <span className={`${styles.listChip} ${styles.listChipSlate}`}>
          +{remainder}
        </span>
      )}
    </div>
  );
}
