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
  const selectedView = gridState?.views.find(
    (view) => view.id === gridState.selectedViewId,
  );
  const title = hasFilters
    ? "No rows match these filters"
    : selectedView != null
      ? "Nothing in this view yet"
      : "Your grid is empty";
  const description = hasFilters
    ? "These conditions returned no results. Adjust the filters to bring matching records back."
    : selectedView != null
      ? `“${selectedView.name}” currently has no matching records. Choose another view or adjust its conditions.`
      : "There are no records to show right now. When data is available, it will appear here.";

  return (
    <output className={styles.overlay}>
      <span className={styles.emptyState}>
        <span aria-hidden="true" className={styles.icon}>
          {hasFilters ? <FilterAltOffOutlinedIcon /> : <InboxOutlinedIcon />}
        </span>
        <span className={styles.eyebrow}>
          {selectedView != null ? selectedView.name : "GRID STATUS"}
        </span>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.description}>{description}</span>
      </span>
    </output>
  );
}
