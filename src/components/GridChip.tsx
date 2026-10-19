import React from "react";
import styles from "../styles/predefined-cells.module.css";

export type GridChipTone = "cyan" | "blue" | "green" | "amber" | "rose" | "purple" | "teal" | "slate";

export interface GridChipProps {
  label: React.ReactNode;
  leadingIcon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  tone?: GridChipTone;
  disabled?: boolean;
  testId?: string;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

const TONE_CLASSES: Record<GridChipTone, string> = {
  cyan: styles.listChipCyan,
  blue: styles.listChipBlue,
  green: styles.listChipGreen,
  amber: styles.listChipAmber,
  rose: styles.listChipRose,
  purple: styles.listChipPurple,
  teal: styles.listChipTeal,
  slate: styles.listChipSlate,
};

/** Shared compact chip button for clickable count and status cells. */
export default function GridChip({
  label,
  leadingIcon,
  onClick,
  tone = "cyan",
  disabled = false,
  testId = "super-data-grid-chip",
  className,
  title,
  style,
  "aria-label": ariaLabel,
}: Readonly<GridChipProps>) {
  const toneClass = TONE_CLASSES[tone];
  const content = (
    <>
      {leadingIcon != null && (
        <span className={styles.gridChipLeadingIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {label}
    </>
  );

  if (onClick == null) {
    return (
      <span
        className={`${styles.listChip} ${toneClass} ${className ?? ""}`.trim()}
        data-test-id={testId}
        aria-label={ariaLabel}
        title={title}
        style={style}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.gridChipButton} ${toneClass} ${className ?? ""}`.trim()}
      onClick={onClick}
      disabled={disabled}
      data-test-id={testId}
      aria-label={ariaLabel}
      title={title}
      style={style}
    >
      {content}
    </button>
  );
}
