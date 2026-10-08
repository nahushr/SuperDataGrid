import React, { useMemo, useState } from "react";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  OpsModal as Dialog,
  OpsModalContent as DialogContent,
} from "@simplishelf/opscards";
import type {
  SuperDataGridPriceBreakdownLine,
  SuperDataGridPriceBreakdownOptions,
} from "../../types";
import {
  asRecord,
  getCurrencyAmount,
  getCurrencyCode,
} from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface PriceBreakdownCellProps {
  value: unknown;
  row?: unknown;
  options?: SuperDataGridPriceBreakdownOptions;
}

type AmountLine = {
  key: SuperDataGridPriceBreakdownLine;
  amount: number | null;
  icon: React.ReactNode;
};

const LINE_LABELS: Record<SuperDataGridPriceBreakdownLine, string> = {
  productsSubtotal: "Products Subtotal",
  discount: "Total Discount",
  subtotal: "Subtotal before GST",
  packaging: "Packaging Fee",
  shipping: "Total Shipping",
  serviceFee: "Service Fee",
  tax: "GST / Tax",
  grandTotal: "Grand Total",
};

function readAmount(
  record: Record<string, unknown>,
  keys: readonly string[],
  options: SuperDataGridPriceBreakdownOptions,
): number | null {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return getCurrencyAmount(record[key], options);
    }
  }
  return null;
}

function formatAmount(
  amount: number,
  currency: string,
  locale?: string,
  minorUnits?: number,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      useGrouping: true,
      ...(minorUnits == null
        ? {}
        : {
            minimumFractionDigits: minorUnits,
            maximumFractionDigits: minorUnits,
          }),
    }).format(amount);
  } catch {
    return amount.toLocaleString(locale);
  }
}

export default function PriceBreakdownCell({
  value,
  row,
  options = {},
}: Readonly<PriceBreakdownCellProps>) {
  const [open, setOpen] = useState(false);
  const record = asRecord(value);
  const currency = getCurrencyCode(value, options, row);
  const breakdown = useMemo(() => {
    if (!record) return null;
    const productsSubtotal = readAmount(record, ["grossSubtotal", "productsSubtotal", "productSubtotal"], options);
    const discount = readAmount(record, ["totalDiscount", "discount", "discountAmount"], options);
    const packaging = readAmount(record, ["totalPackagingCost", "totalPackagingFee", "packagingFee", "packaging"], options);
    const shipping = readAmount(record, ["totalShippingCost", "totalShippingFee", "totalShipping", "shippingFee", "shipping"], options);
    const serviceFee = readAmount(record, ["serviceFee", "serviceFeeAmount"], options);
    const tax = readAmount(record, ["gstAmount", "taxAmount", "tax", "vatAmount"], options);
    const subtotal = readAmount(record, ["subtotalBeforeTax", "orderSubtotal", "subtotal"], options) ??
      (productsSubtotal == null
        ? null
        : productsSubtotal - (discount ?? 0) + (packaging ?? 0) + (shipping ?? 0) + (serviceFee ?? 0));
    const grandTotal = readAmount(record, ["grandTotal", "total"], options) ??
      (subtotal == null ? null : subtotal + (tax ?? 0));
    const lines: AmountLine[] = [
      { key: "productsSubtotal", amount: productsSubtotal, icon: <ShoppingCartOutlinedIcon /> },
      { key: "discount", amount: discount, icon: <PriceChangeOutlinedIcon /> },
      { key: "packaging", amount: packaging, icon: <Inventory2OutlinedIcon /> },
      { key: "shipping", amount: shipping, icon: <LocalShippingOutlinedIcon /> },
      { key: "serviceFee", amount: serviceFee, icon: <ReceiptLongOutlinedIcon /> },
      { key: "subtotal", amount: subtotal, icon: <StorefrontOutlinedIcon /> },
      { key: "tax", amount: tax, icon: <AccountBalanceWalletOutlinedIcon /> },
    ];
    return { grandTotal, lines: lines.filter((line) => line.amount != null) };
  }, [options, record]);

  if (breakdown?.grandTotal == null) {
    return <span className={styles.emptyValue}>—</span>;
  }

  const formattedTotal = formatAmount(
    breakdown.grandTotal,
    currency,
    options.locale,
    options.minorUnits,
  );
  const title = options.title || "Purchase order breakdown";

  return (
    <>
      <button
        aria-label={`Open price breakdown, total ${formattedTotal}`}
        className={styles.breakdownTrigger}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        type="button"
      >
        <span aria-hidden="true" className={styles.breakdownTriggerIcon}>
          <ReceiptLongOutlinedIcon />
        </span>
        <span className={styles.breakdownTriggerContent}>
          <strong className={styles.breakdownTriggerTotal}>{formattedTotal}</strong>
          <span className={styles.breakdownTriggerLink}>View breakdown</span>
        </span>
      </button>
      <Dialog
        onClose={() => setOpen(false)}
        open={open}
        maxWidth="sm"
        title={title}
      >
        <DialogContent>
          <div className={styles.breakdownDialogContent}>
            <div className={styles.breakdownGrandTotal}>
              <span>Grand Total</span>
              <strong>{formattedTotal}</strong>
            </div>
            <div className={styles.breakdownLines}>
              {breakdown.lines.map(({ key, amount, icon }) => (
                <div
                  className={`${styles.breakdownLine} ${key === "discount" ? styles.breakdownDiscount : ""}`}
                  key={key}
                >
                  <span className={styles.breakdownLabel}>
                    <span aria-hidden="true" className={styles.breakdownLineIcon}>{icon}</span>
                    {options.labels?.[key] || LINE_LABELS[key]}
                  </span>
                  <strong>
                    {key === "discount" ? "−" : ""}
                    {formatAmount(Math.abs(amount ?? 0), currency, options.locale, options.minorUnits)}
                  </strong>
                </div>
              ))}
            </div>
            <div className={styles.breakdownTotalRow}>
              <span>{options.labels?.grandTotal || LINE_LABELS.grandTotal}</span>
              <strong>{formattedTotal}</strong>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
