import React from "react";
import { formatCellDate } from "../../utils/formatCellDate";
import styles from "../../styles/predefined-cells.module.css";

export interface UTCTimestampCellProps {
  value: string | Date | null | undefined;
  formatString?: string;
  emptyText?: string;
  showUTCSuffix?: boolean;
  className?: string;
}

export function UTCTimestampCell({
  value,
  formatString = "MMM dd, yyyy HH:mm",
  emptyText = "Never",
  showUTCSuffix = true,
  className,
}: UTCTimestampCellProps) {
  const formatted = formatCellDate(value, formatString, true);
  const text = formatted == null
    ? emptyText
    : `${formatted}${showUTCSuffix ? " UTC" : ""}`;
  return <span className={`${styles.timestamp} ${className ?? ""}`.trim()}>{text}</span>;
}

export default UTCTimestampCell;
