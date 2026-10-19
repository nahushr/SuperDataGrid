import React from "react";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";
import type { SuperDataGridRow } from "../../types";
import PackagePriceCell from "./PackagePriceCell";
import PackageWeightCell from "./PackageWeightCell";
import styles from "../../styles/predefined-cells.module.css";

interface PackageMetricsCellProps {
  row: SuperDataGridRow;
}

/** Displays max weight and per-unit price together using shared package cells. */
export default function PackageMetricsCell({
  row,
}: Readonly<PackageMetricsCellProps>) {
  return (
    <div className={styles.packageMetrics}>
      <div className={styles.packageMetric}>
        <span className={styles.packageMetricLabel}>
          <ScaleOutlinedIcon aria-hidden="true" />
          Max weight
        </span>
        <PackageWeightCell row={row} field="maxWeight" />
      </div>
      <div className={styles.packageMetric}>
        <span className={styles.packageMetricLabel}>
          <PaymentsOutlinedIcon aria-hidden="true" />
          Price per unit
        </span>
        <PackagePriceCell row={row} field="pricePerUnit" />
      </div>
    </div>
  );
}
