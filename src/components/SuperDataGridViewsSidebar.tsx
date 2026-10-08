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
}: Readonly<SuperDataGridViewsSidebarProps>) {
  return (
    <aside
      className={`${styles.viewsSidebar} tw:flex tw:h-full tw:w-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200/80 tw:bg-gradient-to-br tw:from-white tw:to-slate-50 tw:p-3 tw:shadow-lg tw:shadow-slate-900/5`}
      aria-label="Saved views"
    >
      <div
        className={`${styles.sidebarHeader} tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-slate-200/80 tw:px-1 tw:pb-3 tw:pt-1`}
      >
        <div className={`${styles.sidebarHeading} tw:flex tw:min-w-0 tw:flex-col tw:gap-1`}>
          <span className={`${styles.sidebarEyebrow} tw:text-[10px] tw:font-bold tw:tracking-[0.14em] tw:text-slate-400`}>
            WORKSPACE
          </span>
          <Typography className={`${styles.sidebarTitle} tw:text-base tw:font-bold tw:tracking-tight tw:text-slate-900`}>
            Saved views
          </Typography>
        </div>
        {canAdd && (
          <Tooltip title="Add view">
            <IconButton
              size="small"
              color="primary"
              className={`${styles.addViewButton} tw:h-9 tw:w-9 tw:rounded-xl tw:border tw:border-blue-200 tw:bg-blue-50 tw:text-blue-700 tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:border-blue-500 tw:hover:bg-blue-600 tw:hover:text-white tw:hover:shadow-md`}
              aria-label="Add view"
              onClick={onAdd}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <div className={`${styles.viewList} tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-2.5 tw:overflow-y-auto tw:pr-1`}>
        <div
          className={`${styles.viewCard} tw:relative tw:flex tw:min-h-[60px] tw:w-full tw:items-stretch tw:justify-between tw:rounded-xl tw:border tw:border-slate-200/90 tw:bg-white tw:p-2.5 tw:shadow-sm tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:border-blue-200 tw:hover:shadow-md ${selectedViewId === null ? `${styles.selectedView} tw:border-blue-200 tw:bg-blue-50/70 tw:ring-1 tw:ring-blue-100 tw:before:bg-blue-600` : ""}`}
        >
          <Button
            className={`${styles.viewSelectButton} tw:flex tw:min-h-0 tw:flex-1 tw:items-start tw:justify-start tw:rounded-lg tw:p-0 tw:text-left tw:normal-case tw:text-slate-800 tw:hover:bg-transparent`}
            aria-pressed={selectedViewId === null}
            onClick={() => onSelect(null)}
          >
              <span className={`${styles.viewCardContent} tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:items-start tw:gap-1.5`}>
                <span className={`${styles.viewName} tw:max-w-full tw:truncate tw:text-sm tw:font-semibold tw:tracking-tight tw:text-slate-800`}>
                  All data
                </span>
                <Chip
                  className={`${styles.viewCount} tw:h-5 tw:border-transparent tw:bg-slate-100 tw:text-[11px] tw:font-semibold tw:text-slate-600 ${selectedViewId === null ? "tw:bg-blue-100 tw:text-blue-700" : ""}`}
                  size="small"
                  label="All rows"
                />
            </span>
          </Button>
        </div>

        {views.map((view) => {
          const conditionCount = getConditionCount(view);
          return (
            <div
              key={view.id}
              className={`${styles.viewCard} tw:relative tw:flex tw:min-h-[60px] tw:w-full tw:items-stretch tw:justify-between tw:rounded-xl tw:border tw:border-slate-200/90 tw:bg-white tw:p-2.5 tw:shadow-sm tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:border-blue-200 tw:hover:shadow-md ${selectedViewId === view.id ? `${styles.selectedView} tw:border-blue-200 tw:bg-blue-50/70 tw:ring-1 tw:ring-blue-100 tw:before:bg-blue-600` : ""}`}
            >
              <Button
                className={`${styles.viewSelectButton} tw:flex tw:min-h-0 tw:flex-1 tw:items-start tw:justify-start tw:rounded-lg tw:p-0 tw:text-left tw:normal-case tw:text-slate-800 tw:hover:bg-transparent`}
                aria-pressed={selectedViewId === view.id}
                onClick={() => onSelect(view)}
              >
                  <span className={`${styles.viewCardContent} tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:items-start tw:gap-1.5`}>
                    <span className={`${styles.viewName} tw:max-w-full tw:truncate tw:text-sm tw:font-semibold tw:tracking-tight tw:text-slate-800`}>
                      {view.name}
                    </span>
                    <Chip
                      className={`${styles.viewCount} tw:h-5 tw:border-transparent tw:bg-slate-100 tw:text-[11px] tw:font-semibold tw:text-slate-600 ${selectedViewId === view.id ? "tw:bg-blue-100 tw:text-blue-700" : ""}`}
                    size="small"
                    label={`${conditionCount} condition${conditionCount === 1 ? "" : "s"}`}
                  />
                  {view.notes && (
                    <span className={`${styles.viewNotes} tw:max-w-full tw:overflow-hidden tw:text-xs tw:leading-relaxed tw:text-slate-500`}>
                      {view.notes}
                    </span>
                  )}
                </span>
              </Button>
              {(canEdit || canDelete) && <div className={`${styles.viewActions} tw:flex tw:shrink-0 tw:items-center tw:gap-0.5 tw:opacity-70 tw:transition-opacity tw:duration-150`}>
                {canEdit && (
                <Tooltip title={`Edit ${view.name}`}>
                  <IconButton
                    size="small"
                    className={`${styles.editViewButton} tw:h-8 tw:w-8 tw:rounded-lg tw:text-blue-700 tw:hover:bg-blue-100`}
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
                    className={`${styles.deleteViewButton} tw:h-8 tw:w-8 tw:rounded-lg tw:text-rose-600 tw:hover:bg-rose-50`}
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
          <Typography className={`${styles.emptyViews} tw:rounded-xl tw:border tw:border-dashed tw:border-slate-300 tw:bg-white/70 tw:px-3 tw:py-4 tw:text-xs tw:leading-relaxed tw:text-slate-500`}>
            Add a view to save its own filters and notes.
          </Typography>
        )}
      </div>
    </aside>
  );
}
