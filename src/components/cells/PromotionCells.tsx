import React from "react";
import type { SuperDataGridMetricListOptions } from "../../types";
import MetricListCell from "./MetricListCell";
import TitleDescriptionCell from "./TitleDescriptionCell";

interface PromotionCellProps {
  row: Readonly<Record<string, unknown>>;
}

const PROMOTION_PRICING_OPTIONS: SuperDataGridMetricListOptions = {
  columns: 2,
  fields: [
    {
      field: "discountValue",
      label: "Discount",
      format: "currencyOrPercent",
      currencyField: "currency",
      percentField: "isPercent",
      tone: "teal",
    },
    {
      field: "usageLimit",
      label: "Usage limit",
      format: "number",
      unit: "use",
      unitPlural: "uses",
      tone: "info",
    },
  ],
};

const PROMOTION_LIFECYCLE_OPTIONS: SuperDataGridMetricListOptions = {
  columns: 2,
  fields: [
    {
      field: "startDate",
      label: "Starts",
      format: "date",
      tone: "info",
    },
    {
      field: "expiryDate",
      label: "Expires",
      format: "date",
      emptyText: "No expiry",
      tone: "slate",
    },
    {
      field: "lifecycleStatus",
      label: "Status",
      format: "dateRangeStatus",
      fullWidth: true,
      startDateField: "startDate",
      endDateField: "expiryDate",
      inactiveField: "isDeleted",
      activeLabel: "Active",
      scheduledLabel: "Scheduled",
      expiredLabel: "Expired",
      inactiveLabel: "Inactive",
      activeTone: "success",
      scheduledTone: "info",
      expiredTone: "error",
      inactiveTone: "slate",
    },
  ],
};

/** Renders a promotion code and description using the grid's shared details style. */
export function PromotionDetailsCell({ row }: Readonly<PromotionCellProps>) {
  return (
    <TitleDescriptionCell
      value={row.promoCode}
      row={row}
      options={{ descriptionField: "description" }}
    />
  );
}

/** Formats a promotion's discount and usage limit. */
export function PromotionPricingRedemptionCell({ row }: Readonly<PromotionCellProps>) {
  return <MetricListCell value={row} options={PROMOTION_PRICING_OPTIONS} />;
}

/** Shows promotion start, expiry, and derived lifecycle state. */
export function PromotionLifecycleCell({ row }: Readonly<PromotionCellProps>) {
  return <MetricListCell value={row} options={PROMOTION_LIFECYCLE_OPTIONS} />;
}
