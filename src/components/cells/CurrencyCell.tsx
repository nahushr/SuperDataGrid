import React from "react";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
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
      useGrouping: true,
    };
    if (options.minorUnits != null) {
      formatOptions.minimumFractionDigits = options.minorUnits;
      formatOptions.maximumFractionDigits = options.minorUnits;
    }
    return (
      <span className={styles.currencyCard}>
        {options.showIcon !== false && (
          <span aria-hidden="true" className={styles.currencyIcon}>
            <PaymentsOutlinedIcon />
          </span>
        )}
        <span className={styles.currencyAmount}>
        {new Intl.NumberFormat(options.locale, formatOptions).format(amount)}
        </span>
      </span>
    );
  } catch {
    return (
      <span className={styles.currencyCard}>
        {options.showIcon !== false && (
          <span aria-hidden="true" className={styles.currencyIcon}>
            <PaymentsOutlinedIcon />
          </span>
        )}
        <span className={styles.currencyAmount}>
        {amount.toLocaleString(options.locale)}
        </span>
      </span>
    );
  }
}
