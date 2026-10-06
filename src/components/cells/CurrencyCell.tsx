import React from "react";
import type { SuperDataGridCurrencyOptions } from "../../types";
import {
  getCurrencyAmount,
  getCurrencyCode,
} from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface CurrencyCellProps {
  value: unknown;
  row?: unknown;
  options?: SuperDataGridCurrencyOptions;
}

export default function CurrencyCell({
  value,
  row,
  options = {},
}: CurrencyCellProps) {
  const amount = getCurrencyAmount(value, options);
  if (amount == null) return <span className={styles.emptyValue}>—</span>;

  const currency = getCurrencyCode(value, options, row);
  try {
    const formatOptions: Intl.NumberFormatOptions = {
      style: "currency",
      currency,
    };
    if (options.minorUnits != null) {
      formatOptions.minimumFractionDigits = options.minorUnits;
      formatOptions.maximumFractionDigits = options.minorUnits;
    }
    return (
      <span className={styles.currency}>
        {new Intl.NumberFormat(options.locale, formatOptions).format(amount)}
      </span>
    );
  } catch {
    return (
      <span className={styles.currency}>
        {amount.toLocaleString(options.locale)}
      </span>
    );
  }
}
