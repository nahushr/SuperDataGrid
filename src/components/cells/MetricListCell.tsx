import React from "react";
import type {
  SuperDataGridBadgeColor,
  SuperDataGridMetricField,
  SuperDataGridMetricListOptions,
} from "../../types";
import {
  asRecord,
  getCurrencyAmount,
  getCurrencyCode,
  parseDateValue,
} from "../../utils/predefinedCellData";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

interface MetricListCellProps {
  value: unknown;
  options?: SuperDataGridMetricListOptions;
}

const TONE_CLASSES: Record<SuperDataGridBadgeColor, string> = {
  primary: styles.metricToneCyan,
  info: styles.metricToneBlue,
  success: styles.metricToneGreen,
  warning: styles.metricToneAmber,
  error: styles.metricToneRose,
  purple: styles.metricTonePurple,
  neutral: styles.metricToneSlate,
  teal: styles.metricToneTeal,
  cyan: styles.metricToneCyan,
  indigo: styles.metricToneBlue,
  orange: styles.metricToneAmber,
  slate: styles.metricToneSlate,
};

function readField(record: Record<string, unknown>, field: string): unknown {
  return record[field];
}

function formatCurrency(
  amount: unknown,
  currency: string,
): string {
  const numericAmount = getCurrencyAmount(amount);
  if (numericAmount == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString()}`;
  }
}

function formatDate(value: unknown): string {
  const date = parseDateValue(value);
  if (date == null) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatNumber(value: unknown): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number)
    : "—";
}

function getMetricValue(
  record: Record<string, unknown>,
  field: SuperDataGridMetricField,
): { value: string; tone?: SuperDataGridBadgeColor } {
  if (field.format === "dateRangeStatus") {
    const startDate = parseDateValue(
      field.startDateField ? record[field.startDateField] : undefined,
    );
    const endDate = parseDateValue(
      field.endDateField ? record[field.endDateField] : undefined,
    );
    const today = new Date();
    const todayUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );
    const startUtc = startDate == null
      ? null
      : Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const endUtc = endDate == null
      ? null
      : Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    if (field.inactiveField && record[field.inactiveField] === true) {
      return {
        value: field.inactiveLabel ?? "Inactive",
        tone: field.inactiveTone ?? field.tone,
      };
    }
    if (startUtc != null && startUtc > todayUtc) {
      return {
        value: field.scheduledLabel ?? "Scheduled",
        tone: field.scheduledTone ?? field.tone,
      };
    }
    if (endUtc != null && endUtc < todayUtc) {
      return {
        value: field.expiredLabel ?? "Expired",
        tone: field.expiredTone ?? field.tone,
      };
    }
    return {
      value: field.activeLabel ?? "Active",
      tone: field.activeTone ?? field.tone,
    };
  }

  const rawValue = readField(record, field.field);
  if (rawValue == null || rawValue === "") {
    return { value: field.emptyText ?? "—", tone: field.tone };
  }

  switch (field.format ?? "text") {
    case "number": {
      const number = Number(rawValue);
      const formatted = formatNumber(rawValue);
      const unit = number === 1
        ? field.unit
        : field.unitPlural ?? field.unit;
      return {
        value: unit ? `${formatted} ${unit}` : formatted,
        tone: field.tone,
      };
    }
    case "currency":
      return {
        value: formatCurrency(
          rawValue,
          getCurrencyCode(rawValue, { currencyField: field.currencyField }, record),
        ),
        tone: field.tone,
      };
    case "percent":
      return { value: `${formatNumber(rawValue)}%`, tone: field.tone };
    case "currencyOrPercent": {
      if (field.percentField && record[field.percentField] === true) {
        return { value: `${formatNumber(rawValue)}%`, tone: field.tone };
      }
      return {
        value: formatCurrency(
          rawValue,
          getCurrencyCode(rawValue, { currencyField: field.currencyField }, record),
        ),
        tone: field.tone,
      };
    }
    case "date":
      return { value: formatDate(rawValue), tone: field.tone };
    case "boolean": {
      const enabled = rawValue === true;
      return {
        value: enabled
          ? field.trueLabel ?? "Yes"
          : field.falseLabel ?? "No",
        tone: enabled
          ? field.trueTone ?? field.tone
          : field.falseTone ?? field.tone,
      };
    }
    case "text":
    default:
      return { value: toDisplayValue(rawValue) || "—", tone: field.tone };
  }
}

export default function MetricListCell({ value, options }: Readonly<MetricListCellProps>) {
  const record = asRecord(value);
  const fields = options?.fields ?? [];
  if (record == null || fields.length === 0) {
    return <span className={styles.emptyValue}>—</span>;
  }

  const columnCount = Math.min(options?.columns ?? 2, fields.length);
  const columnClass = columnCount === 1
    ? styles.metricListOneColumn
    : columnCount === 3
      ? styles.metricListThreeColumns
      : styles.metricListTwoColumns;

  return (
    <div className={`${styles.metricList} ${columnClass}`}>
      {fields.map((field) => {
        const metric = getMetricValue(record, field);
        const toneClass = metric.tone ? TONE_CLASSES[metric.tone] : "";
        const widthClass = field.fullWidth ? styles.metricItemWide : "";
        return (
          <div className={`${styles.metricItem} ${widthClass} ${toneClass}`} key={field.field}>
            <span className={styles.metricLabel}>{field.label}</span>
            <span className={styles.metricValue} title={metric.value}>
              {metric.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
