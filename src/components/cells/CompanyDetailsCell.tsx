import React from "react";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import type { SuperDataGridCompanyDetailsOptions } from "../../types";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

interface CompanyDetailsCellProps {
  value: unknown;
  options?: SuperDataGridCompanyDetailsOptions;
}

function readText(record: Record<string, unknown>, fields: readonly string[]): string {
  for (const field of fields) {
    const candidate = record[field];
    if (typeof candidate === "string" || typeof candidate === "number") {
      const text = String(candidate).trim();
      if (text) return text;
    }
  }
  return "";
}

export default function CompanyDetailsCell({
  value,
  options = {},
}: Readonly<CompanyDetailsCellProps>) {
  const record =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;

  if (record == null) {
    const company = toDisplayValue(value);
    return company
      ? <div className={styles.companyDetails}><strong className={styles.companyDetailsName}>{company}</strong></div>
      : <span className={styles.emptyValue}>—</span>;
  }

  const company = readText(record, ["company", "companyName", "name"]);
  const title = readText(record, ["title", "jobTitle", "role"]);
  const employeeCount = readText(record, ["companySize", "employeeCount", "employees"]);
  const revenueValue = readText(record, ["annualRevenue", "revenue"]);
  const revenueNumber = Number(revenueValue);
  const annualRevenue = revenueValue && Number.isFinite(revenueNumber)
    ? revenueNumber.toLocaleString("en-US")
    : revenueValue;

  if (!company && !title && !employeeCount && !annualRevenue) {
    return <span className={styles.emptyValue}>—</span>;
  }

  return (
    <div className={styles.companyDetails}>
      {(company || title) && (
        <div className={styles.companyDetailsHeading}>
          <span className={styles.companyDetailsIcon} aria-hidden="true">
            <BusinessOutlinedIcon />
          </span>
          <div className={styles.companyDetailsIdentity}>
            <strong className={styles.companyDetailsName} title={company}>
              {company || "Company unavailable"}
            </strong>
            {title && (
              <span className={styles.companyDetailsTitle} title={title}>
                <WorkOutlineIcon aria-hidden="true" />
                {title}
              </span>
            )}
          </div>
        </div>
      )}
      {(employeeCount || annualRevenue) && (
        <div className={styles.companyDetailsMetrics}>
          {employeeCount && (
            <span className={styles.companyDetailsMetric}>
              <GroupsOutlinedIcon aria-hidden="true" />
              {employeeCount} {options.employeeLabel ?? "employees"}
            </span>
          )}
          {annualRevenue && (
            <span className={styles.companyDetailsMetric}>
              <QueryStatsOutlinedIcon aria-hidden="true" />
              {options.revenueLabel ?? "Annual revenue"}: {annualRevenue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
