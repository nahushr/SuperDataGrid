import React from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
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
}: Readonly<DateTimeCellProps>) {
  const date = parseDateValue(value);
  if (!date) return <span className={styles.emptyValue}>—</span>;

  try {
    const formatOptions: Intl.DateTimeFormatOptions = options.formatOptions
      ? {
          ...options.formatOptions,
          ...(options.timeZone
            ? { timeZone: options.timeZone }
            : {}),
        }
      : {
          dateStyle: "medium",
          timeStyle: "short",
          ...(options.timeZone ? { timeZone: options.timeZone } : {}),
        };

    return (
      <span className={styles.formattedDate}>
        {options.showIcon !== false && <CalendarMonthIcon className={styles.dateIcon} aria-hidden="true" />}
        <span>
        {new Intl.DateTimeFormat(options.locale, formatOptions).format(date)}
        </span>
      </span>
    );
  } catch {
    return (
      <span className={styles.formattedDate}>
        {options.showIcon !== false && <CalendarMonthIcon className={styles.dateIcon} aria-hidden="true" />}
        <span>
        {date.toLocaleString(
          options.locale,
          options.timeZone ? { timeZone: options.timeZone } : undefined,
        )}
        </span>
      </span>
    );
  }
}
