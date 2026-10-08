import React from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { SuperDataGridDateOptions } from "../../types";
import { formatCellDate } from "../../utils/formatCellDate";
import { parseDateValue } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

export interface DateCellProps {
  value: unknown;
  options?: SuperDataGridDateOptions;
  formatString?: string;
  emptyText?: string;
  showIcon?: boolean;
  className?: string;
}

export function DateCell(props: DateCellProps) {
  const {
    value,
    options = {},
    formatString = "do MMM yyyy",
    emptyText = "—",
    showIcon,
    className,
  } = props;
  const compatibilityFormatRequested =
    props.formatString != null || props.emptyText != null || props.className != null;
  const date = parseDateValue(value);
  if (!date) return <span className={`${styles.emptyValue} ${className ?? ""}`.trim()}>{emptyText}</span>;

  if (compatibilityFormatRequested) {
    const formatted = formatCellDate(value, formatString, false, options.timeZone);
    return (
      <span className={`${styles.dateValue} ${className ?? ""}`.trim()}>
        {formatted ?? emptyText}
      </span>
    );
  }

  try {
    return (
      <span className={`${styles.formattedDate} ${className ?? ""}`.trim()}>
        {(showIcon ?? options.showIcon !== false) && (
          <CalendarMonthIcon className={styles.dateIcon} aria-hidden="true" />
        )}
        <span>
          {new Intl.DateTimeFormat(options.locale, {
            dateStyle: "medium",
            timeZone: options.timeZone,
            ...options.formatOptions,
          }).format(date)}
        </span>
      </span>
    );
  } catch {
    return (
      <span className={`${styles.formattedDate} ${className ?? ""}`.trim()}>
        {(showIcon ?? options.showIcon !== false) && (
          <CalendarMonthIcon className={styles.dateIcon} aria-hidden="true" />
        )}
        <span>{date.toLocaleDateString(options.locale)}</span>
      </span>
    );
  }
}

export default DateCell;
