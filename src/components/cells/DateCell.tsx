import React from "react";
import type { SuperDataGridDateOptions } from "../../types";
import { parseDateValue } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface DateCellProps {
  value: unknown;
  options?: SuperDataGridDateOptions;
}

export default function DateCell({ value, options = {} }: DateCellProps) {
  const date = parseDateValue(value);
  if (!date) return <span className={styles.emptyValue}>—</span>;

  try {
    return (
      <span className={styles.formattedDate}>
        {new Intl.DateTimeFormat(options.locale, {
          dateStyle: "medium",
          timeZone: options.timeZone,
          ...options.formatOptions,
        }).format(date)}
      </span>
    );
  } catch {
    return (
      <span className={styles.formattedDate}>
        {date.toLocaleDateString(options.locale)}
      </span>
    );
  }
}
