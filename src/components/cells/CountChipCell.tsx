import React from "react";
import GridChip, { type GridChipTone } from "../GridChip";
import type { SuperDataGridBadgeColor, SuperDataGridCountChipOptions } from "../../types";
import styles from "../../styles/predefined-cells.module.css";

interface CountChipCellProps {
  value: unknown;
  row: Readonly<Record<string, unknown>>;
  options?: SuperDataGridCountChipOptions;
}

const CHIP_TONES: Record<SuperDataGridBadgeColor, GridChipTone> = {
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

export default function CountChipCell({ value, row, options = {} }: Readonly<CountChipCellProps>) {
  const parsedCount = typeof value === "number" ? value : Number(value);
  const count = Number.isFinite(parsedCount) ? parsedCount : 0;
  const label = options.label?.trim();
  const text = count <= 0
    ? options.zeroLabel ?? "None"
    : label
      ? `${count} ${label}${count === 1 ? "" : "s"}`
      : String(count);
  const chipLabel = options.icon ? (
    <span className={styles.countChipContent}>
      <span aria-hidden="true" className={styles.countChipIcon}>{options.icon}</span>
      <span>{text}</span>
    </span>
  ) : text;

  return (
    <GridChip
      label={chipLabel}
      tone={CHIP_TONES[options.color ?? "cyan"]}
      disabled={count <= 0 || options.onClick == null}
      aria-label={options.ariaLabel ?? text}
      onClick={options.onClick ? (event) => {
        event.stopPropagation();
        options.onClick?.(value, row);
      } : undefined}
    />
  );
}
