import React, { useContext } from "react";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { SuperDataGridContext } from "../context/SuperDataGridContext";
import styles from "../styles/no-rows-overlay.module.css";

export default function SuperDataGridNoRowsOverlay() {
  const gridState = useContext(SuperDataGridContext);
  const hasFilters = gridState?.filterModel.items.some(
    (filter) => filter.field !== "" && filter.operator !== "",
  ) ?? false;

  return (
    <div className={styles.overlay} role="status">
      <span aria-hidden="true" className={styles.icon}>
        {hasFilters ? <FilterAltOffOutlinedIcon /> : <InboxOutlinedIcon />}
      </span>
      <strong className={styles.title}>
        {hasFilters ? "No rows match these filters" : "No rows to display"}
      </strong>
      {hasFilters && (
        <span className={styles.description}>
          Adjust or clear the filter conditions to see matching records.
        </span>
      )}
    </div>
  );
}
