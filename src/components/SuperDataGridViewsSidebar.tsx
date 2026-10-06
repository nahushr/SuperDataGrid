import React from "react";
import { Button, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { SuperDataGridView } from "../types";
import styles from "../styles/views.module.css";

interface SuperDataGridViewsSidebarProps {
  views: readonly SuperDataGridView[];
  selectedViewId: string | null;
  onAdd: () => void;
  onSelect: (view: SuperDataGridView | null) => void;
  onEdit: (view: SuperDataGridView) => void;
  onDelete: (view: SuperDataGridView) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

function getConditionCount(view: SuperDataGridView): number {
  return view.filterModel.items.filter(
    (item) => item.field !== "" && item.operator !== "",
  ).length;
}

export default function SuperDataGridViewsSidebar({
  views,
  selectedViewId,
  onAdd,
  onSelect,
  onEdit,
  onDelete,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}: SuperDataGridViewsSidebarProps) {
  return (
    <aside className={styles.viewsSidebar} aria-label="Saved views">
      <div className={styles.sidebarHeader}>
        <Typography className={styles.sidebarTitle}>Views</Typography>
        {canAdd && (
          <Tooltip title="Add view">
            <IconButton
              size="small"
              color="primary"
              aria-label="Add view"
              onClick={onAdd}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <div className={styles.viewList}>
        <div
          className={`${styles.viewCard} ${selectedViewId === null ? styles.selectedView : ""}`}
        >
          <Button
            className={styles.viewSelectButton}
            aria-pressed={selectedViewId === null}
            onClick={() => onSelect(null)}
          >
            <span className={styles.viewCardContent}>
              <span className={styles.viewName}>All data</span>
              <Chip className={styles.viewCount} size="small" label="All rows" />
            </span>
          </Button>
        </div>

        {views.map((view) => {
          const conditionCount = getConditionCount(view);
          return (
            <div
              key={view.id}
              className={`${styles.viewCard} ${selectedViewId === view.id ? styles.selectedView : ""}`}
            >
              <Button
                className={styles.viewSelectButton}
                aria-pressed={selectedViewId === view.id}
                onClick={() => onSelect(view)}
              >
                <span className={styles.viewCardContent}>
                  <span className={styles.viewName}>{view.name}</span>
                  <Chip
                    className={styles.viewCount}
                    size="small"
                    label={`${conditionCount} condition${conditionCount === 1 ? "" : "s"}`}
                  />
                  {view.notes && (
                    <span className={styles.viewNotes}>{view.notes}</span>
                  )}
                </span>
              </Button>
              {(canEdit || canDelete) && <div className={styles.viewActions}>
                {canEdit && (
                <Tooltip title={`Edit ${view.name}`}>
                  <IconButton
                    size="small"
                    className={styles.editViewButton}
                    aria-label={`Edit ${view.name}`}
                    onClick={() => onEdit(view)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                )}
                {canDelete && (
                <Tooltip title={`Delete ${view.name}`}>
                  <IconButton
                    size="small"
                    className={styles.deleteViewButton}
                    aria-label={`Delete ${view.name}`}
                    onClick={() => onDelete(view)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                )}
              </div>}
            </div>
          );
        })}

        {views.length === 0 && (
          <Typography className={styles.emptyViews}>
            Add a view to save its own filters and notes.
          </Typography>
        )}
      </div>
    </aside>
  );
}
