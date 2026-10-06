import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Tooltip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import {
  Toolbar,
  gridFilteredSortedRowIdsSelector,
  gridPaginatedVisibleSortedGridRowIdsSelector,
  useGridApiContext,
  useGridSelector,
  type GridDensity,
  type GridRowId,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import { SuperDataGridContext } from "../context/SuperDataGridContext";
import SuperDataGridExportScopeDialog from "./SuperDataGridExportScopeDialog";
import { exportGridData, type ExportFormat } from "../utils/export";
import styles from "../styles/toolbar.module.css";

const DENSITY_OPTIONS: Array<{ label: string; value: GridDensity }> = [
  { label: "Compact", value: "compact" },
  { label: "Standard", value: "standard" },
  { label: "Comfortable", value: "comfortable" },
];

const EXPORT_FORMATS: Array<{ label: string; value: ExportFormat }> = [
  { label: "XLSX (.xlsx)", value: "xlsx" },
  { label: "CSV (.csv)", value: "csv" },
  { label: "JSON (.json)", value: "json" },
  { label: "SQL (.sql)", value: "sql" },
];

function rowsForIds(
  ids: readonly GridRowId[],
  rows: readonly GridValidRowModel[],
  columns: readonly { field: string }[],
): Record<string, unknown>[] {
  const rowById = new Map(rows.map((row) => [row.id, row] as const));
  return ids.flatMap((id) => {
    const row = rowById.get(id);
    if (row == null) return [];
    return [
      Object.fromEntries(columns.map((column) => [column.field, row[column.field]])),
    ];
  });
}

export default function SuperDataGridToolbar() {
  const apiRef = useGridApiContext();
  const filteredSortedRowIds = useGridSelector(
    apiRef,
    gridFilteredSortedRowIdsSelector,
  );
  const currentPageRowIds = useGridSelector(
    apiRef,
    gridPaginatedVisibleSortedGridRowIdsSelector,
  );
  const gridState = useContext(SuperDataGridContext);
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [densityAnchor, setDensityAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const exportControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const abortExport = () => exportControllerRef.current?.abort();
    window.addEventListener("pagehide", abortExport);
    return () => {
      window.removeEventListener("pagehide", abortExport);
      abortExport();
    };
  }, []);

  useEffect(() => {
    if (!gridState?.checkboxSelection) return undefined;
    return apiRef.current.subscribeEvent(
      "headerSelectionCheckboxChange",
      ({ value }) => gridState.onHeaderSelectionIntent(value),
    );
  }, [apiRef, gridState?.checkboxSelection, gridState?.onHeaderSelectionIntent]);

  if (gridState == null) return null;

  const activeFilterCount = gridState.filterModel.items.filter(
    (filter) => filter.field !== "" && filter.operator !== "",
  ).length;
  const toggleableColumns = gridState.columns.filter(
    (column) => column.hideable !== false,
  );
  const exportColumns = gridState.columns
    .filter((column) => gridState.columnVisibilityModel[column.field] !== false)
    .map((column) => ({ field: column.field, headerName: column.headerName }));
  const serverSide =
    gridState.filterMode === "server" || gridState.paginationMode === "server";
  const formatLabel =
    EXPORT_FORMATS.find((format) => format.value === exportFormat)?.label ??
    "data";

  const reportExport = (format: ExportFormat, scope: "currentPage" | "allMatching") => {
    gridState.onExport?.({
      format,
      scope,
      columns: exportColumns.map((column) => column.field),
      filterModel: gridState.filterModel,
      paginationModel: gridState.paginationModel,
      includeDeleted: gridState.includeDeleted,
    });
  };

  const updateColumnVisibility = (field: string, visible: boolean) => {
    const nextModel = { ...gridState.columnVisibilityModel };
    if (visible) {
      delete nextModel[field];
    } else {
      nextModel[field] = false;
    }
    gridState.onColumnVisibilityModelChange(nextModel);
  };

  const runExport = async (
    format: ExportFormat,
    selectedRows: Record<string, unknown>[],
    signal?: AbortSignal,
  ) => {
    setExportError(null);
    setIsExporting(true);
    const fileName = `export_${new Date().toISOString().slice(0, 10)}`;

    try {
      await exportGridData(format, exportColumns, selectedRows, fileName, signal);
    } catch (error) {
      if (!signal?.aborted) {
        setExportError(
          error instanceof Error ? error.message : "The export could not be created.",
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const chooseExportFormat = (format: ExportFormat) => {
    setExportAnchor(null);
    setExportFormat(format);
    if (serverSide) {
      setScopeDialogOpen(true);
      return;
    }

    reportExport(format, "allMatching");
    const rows = rowsForIds(
      filteredSortedRowIds,
      gridState.rows,
      exportColumns,
    );
    void runExport(format, rows);
  };

  const exportCurrentView = () => {
    if (exportFormat == null) return;
    setScopeDialogOpen(false);
    reportExport(exportFormat, "currentPage");
    const rows = rowsForIds(
      currentPageRowIds,
      gridState.rows,
      exportColumns,
    );
    void runExport(exportFormat, rows);
  };

  const exportAllData = async () => {
    if (exportFormat == null || gridState.getAllData == null) return;

    setScopeDialogOpen(false);
    reportExport(exportFormat, "allMatching");
    const controller = new AbortController();
    exportControllerRef.current?.abort();
    exportControllerRef.current = controller;
    setExportError(null);
    setIsExporting(true);

    try {
      const allRows = await gridState.getAllData({
        columns: exportColumns.map((column) => column.field),
        filterModel: gridState.filterModel,
        paginationModel: gridState.paginationModel,
        includeDeleted: gridState.includeDeleted,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const selectedRows = allRows.map((row) => {
        const record = row as Record<string, unknown>;
        return Object.fromEntries(
          exportColumns.map((column) => [column.field, record[column.field]]),
        );
      });
      await runExport(exportFormat, selectedRows, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) {
        setExportError(
          error instanceof Error ? error.message : "The server data could not be loaded.",
        );
      }
    } finally {
      if (exportControllerRef.current === controller) {
        exportControllerRef.current = null;
      }
      setIsExporting(false);
    }
  };

  const closeScopeDialog = () => {
    setScopeDialogOpen(false);
    setExportFormat(null);
  };

  const deleteSelectedRows = async () => {
    if (isDeleting || gridState.selectionCount === 0) return;
    setBulkDeleteError(null);
    setIsDeleting(true);
    try {
      await gridState.onBulkDelete();
    } catch (error) {
      setBulkDeleteError(
        error instanceof Error ? error.message : "The selected rows could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Toolbar className={styles.toolbar}>
        <div className={styles.toolbarRow}>
        <div className={styles.actions}>
          {!gridState.hideViews && (
            <Tooltip title="Show or hide saved views">
              <Button
                size="small"
                variant={gridState.viewsOpen ? "contained" : "outlined"}
                startIcon={<ViewSidebarIcon />}
                className={styles.toolbarButton}
                aria-pressed={gridState.viewsOpen}
                onClick={gridState.onToggleViews}
              >
                Views
              </Button>
            </Tooltip>
          )}
          {gridState.checkboxSelection && gridState.selectionCount > 0 && (
            <Tooltip title={`Clear ${gridState.selectionCount} selected rows`}>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<ClearAllIcon />}
                className={`${styles.toolbarButton} ${styles.clearSelectionButton}`}
                onClick={gridState.onClearSelection}
              >
                Clear selection ({gridState.selectionCount})
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Filter data">
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                size="small"
                variant={activeFilterCount > 0 ? "contained" : "outlined"}
                startIcon={<FilterListIcon />}
                className={styles.toolbarButton}
                onClick={gridState.onFilterClick}
              >
                Filter
              </Button>
            </Badge>
          </Tooltip>

          {toggleableColumns.length > 0 && (
            <Tooltip title="Show or hide columns">
              <Button
                size="small"
                variant="outlined"
                startIcon={<ViewColumnIcon />}
                className={styles.toolbarButton}
                aria-haspopup="true"
                aria-expanded={columnsAnchor ? "true" : undefined}
                onClick={(event) => setColumnsAnchor(event.currentTarget)}
              >
                Columns
              </Button>
            </Tooltip>
          )}
          <Menu
            anchorEl={columnsAnchor}
            open={Boolean(columnsAnchor)}
            onClose={() => setColumnsAnchor(null)}
          >
            {toggleableColumns.map((column) => (
              <MenuItem key={column.field}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={gridState.columnVisibilityModel[column.field] !== false}
                      onChange={(event) =>
                        updateColumnVisibility(column.field, event.target.checked)
                      }
                    />
                  }
                  label={column.headerName ?? column.field}
                />
              </MenuItem>
            ))}
          </Menu>

          <Tooltip title="Adjust row density">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DensityMediumIcon />}
              className={styles.toolbarButton}
              aria-haspopup="true"
              aria-expanded={densityAnchor ? "true" : undefined}
              onClick={(event) => setDensityAnchor(event.currentTarget)}
            >
              Density
            </Button>
          </Tooltip>
          <Menu
            anchorEl={densityAnchor}
            open={Boolean(densityAnchor)}
            onClose={() => setDensityAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            {DENSITY_OPTIONS.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() => {
                  gridState.onDensityChange(option.value);
                  setDensityAnchor(null);
                }}
              >
                <ListItemIcon>
                  {gridState.density === option.value ? (
                    <CheckIcon fontSize="small" />
                  ) : null}
                </ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>

          <Tooltip title={isExporting ? "Creating export" : "Export data"}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  isExporting ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <FileDownloadIcon />
                  )
                }
                className={styles.toolbarButton}
                aria-haspopup="menu"
                aria-expanded={exportAnchor ? "true" : undefined}
                disabled={isExporting}
                onClick={(event) => setExportAnchor(event.currentTarget)}
              >
                {isExporting ? "Exporting" : "Export"}
              </Button>
            </span>
          </Tooltip>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            {EXPORT_FORMATS.map((format) => (
              <MenuItem
                key={format.value}
                onClick={() => chooseExportFormat(format.value)}
              >
                {format.label}
              </MenuItem>
            ))}
          </Menu>
        </div>
        <div className={styles.trailingActions}>
          {gridState.canBulkDelete && (
            <Tooltip
              title={
                gridState.selectionCount > 0
                  ? `${gridState.selectionCount} selected ${gridState.selectionLabel}`
                  : "Select rows to enable bulk delete"
              }
            >
              <span>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={
                    isDeleting ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <DeleteOutlineIcon />
                    )
                  }
                  className={`${styles.toolbarButton} ${styles.bulkDeleteButton}`}
                  disabled={gridState.selectionCount === 0 || isDeleting}
                  onClick={() => void deleteSelectedRows()}
                >
                  {isDeleting ? "Working" : gridState.bulkDeleteLabel}
                  {gridState.selectionCount > 0 ? ` (${gridState.selectionCount})` : ""}
                </Button>
              </span>
            </Tooltip>
          )}
          {gridState.showIncludeDeleted && (
            <FormControlLabel
              className={styles.includeDeletedLabel}
              control={
                <Checkbox
                  size="small"
                  checked={gridState.includeDeleted}
                  onChange={(event) =>
                    gridState.onIncludeDeletedChange?.(event.target.checked)
                  }
                />
              }
              label="Include Deleted"
            />
          )}
        </div>
        </div>
        {gridState.beforeTable != null && (
          <div className={styles.beforeTableContent}>
            {gridState.beforeTable}
          </div>
        )}
      </Toolbar>

      <SuperDataGridExportScopeDialog
        open={scopeDialogOpen}
        formatLabel={formatLabel}
        canExportAllData={gridState.getAllData != null}
        onClose={closeScopeDialog}
        onCurrentView={exportCurrentView}
        onAllData={() => void exportAllData()}
      />

      <Snackbar
        open={exportError != null}
        autoHideDuration={5000}
        onClose={() => setExportError(null)}
      >
        <Alert severity="error" onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      </Snackbar>
      <Snackbar
        open={bulkDeleteError != null}
        autoHideDuration={5000}
        onClose={() => setBulkDeleteError(null)}
      >
        <Alert severity="error" onClose={() => setBulkDeleteError(null)}>
          {bulkDeleteError}
        </Alert>
      </Snackbar>
    </>
  );
}
