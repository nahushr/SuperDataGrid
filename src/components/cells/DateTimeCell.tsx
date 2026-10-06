import React from "react";
import type { SuperDataGridDateOptions } from "../../types";
import { parseDateValue } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface DateTimeCellProps {
  value: unknown;
  options?: SuperDataGridDateOptions;
}

export default function DateTimeCell({
  value,
  options = {},
}: DateTimeCellProps) {
  const date = parseDateValue(value);
  if (!date) return <span className={styles.emptyValue}>—</span>;

  try {
    return (
      <span className={styles.formattedDate}>
        {new Intl.DateTimeFormat(options.locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: options.timeZone,
          ...options.formatOptions,
        }).format(date)}
      </span>
    );
  } catch {
    return (
      <span className={styles.formattedDate}>
        {date.toLocaleString(options.locale)}
      </span>
    );
  }
}
