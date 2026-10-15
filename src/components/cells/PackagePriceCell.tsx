import React from "react";
import CurrencyCell from "./CurrencyCell";
import type { SuperDataGridRow } from "../../types";

interface PackagePriceCellProps {
  row: SuperDataGridRow;
  field: string;
}

export default function PackagePriceCell({
  row,
  field,
}: Readonly<PackagePriceCellProps>) {
  const record = row as Record<string, unknown>;
  const nested = record._package;
  const packageRecord = nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : record;
  const amount = record[field] ?? packageRecord[field];
  const currency = record.currency ?? packageRecord.currency;

  return (
    <CurrencyCell
      options={{ showIcon: false }}
      row={row}
      value={{ amount, currency }}
    />
  );
}
