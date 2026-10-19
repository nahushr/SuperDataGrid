import React from "react";
import type {
  SuperDataGridPackageDetailsOptions,
  SuperDataGridRow,
} from "../../types";
import PackageDetailsCell from "./PackageDetailsCell";
import PackageImageGalleryCell from "./PackageImageGalleryCell";
import styles from "../../styles/predefined-cells.module.css";

interface PackageOverviewCellProps {
  row: SuperDataGridRow;
  options?: SuperDataGridPackageDetailsOptions;
}

/** Combines package photos and identifying details into one compact grid cell. */
export default function PackageOverviewCell({
  row,
  options,
}: Readonly<PackageOverviewCellProps>) {
  return (
    <div className={styles.packageOverview}>
      <PackageImageGalleryCell row={row} thumbnailOnly />
      <div className={styles.packageOverviewDetails}>
        <PackageDetailsCell row={row as Record<string, unknown>} options={options} />
      </div>
    </div>
  );
}
