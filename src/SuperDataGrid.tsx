import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  GridLogicOperator,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridDensity,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowId,
  type GridRowSelectionModel,
  type GridSortModel,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import SuperDataGridFilterPanel from "./components/SuperDataGridFilterPanel";
import SuperDataGridPagination, {
  PAGE_SIZE_OPTIONS,
} from "./components/SuperDataGridPagination";
import SuperDataGridLoadingOverlay from "./components/SuperDataGridLoadingOverlay";
import SuperDataGridAddViewDialog from "./components/SuperDataGridAddViewDialog";
import SuperDataGridToolbar from "./components/SuperDataGridToolbar";
import SuperDataGridViewsSidebar from "./components/SuperDataGridViewsSidebar";
import SuperDataGridSelectionScopeDialog from "./components/SuperDataGridSelectionScopeDialog";
import ActionsCell from "./components/cells/ActionsCell";
import AddressCell from "./components/cells/AddressCell";
import AuditCell from "./components/cells/AuditCell";
import CurrencyCell from "./components/cells/CurrencyCell";
import DateCell from "./components/cells/DateCell";
import DateTimeCell from "./components/cells/DateTimeCell";
import EmailCell from "./components/cells/EmailCell";
import ImagePreviewCell from "./components/cells/ImagePreviewCell";
import JsonPreviewCell from "./components/cells/JsonPreviewCell";
import LongTextCell from "./components/cells/LongTextCell";
import PeopleDetailsCell from "./components/cells/PeopleDetailsCell";
import PhoneCell from "./components/cells/PhoneCell";
import StatusBadgeCell from "./components/cells/StatusBadgeCell";
import { SuperDataGridContext } from "./context/SuperDataGridContext";
import {
  getColumnHeaderHeight,
  inferColumnType,
  isGridRowId,
  toDisplayValue,
  toHeaderName,
} from "./utils/gridData";
import {
  createFilterFields,
  getFilterFieldValue,
} from "./utils/filterFields";
import { getCommonCellSearchText } from "./utils/commonCellData";
import { getCurrencyAmount, parseDateValue } from "./utils/predefinedCellData";
import type {
  SuperDataGridBulkDeleteRequest,
  SuperDataGridProps,
  SuperDataGridRow,
  SuperDataGridView,
} from "./types";
import styles from "./styles/grid.module.css";

export type {
  SuperDataGridActionRequest,
  SuperDataGridActionType,
  SuperDataGridAllDataFetcher,
  SuperDataGridAllDataRequest,
  SuperDataGridAllRowsRequest,
  SuperDataGridBulkDeleteRequest,
  SuperDataGridCellComponent,
  SuperDataGridCellProps,
  SuperDataGridColumnType,
  SuperDataGridBadgeColor,
  SuperDataGridBadgeOptions,
  SuperDataGridColumnOptions,
  SuperDataGridCurrencyOptions,
  SuperDataGridDateOptions,
  SuperDataGridEmailOptions,
  SuperDataGridImageOptions,
  SuperDataGridJsonOptions,
  SuperDataGridLongTextOptions,
  SuperDataGridPhoneOptions,
  SuperDataGridExportFormat,
  SuperDataGridExportRequest,
  SuperDataGridExportScope,
  SuperDataGridProps,
  SuperDataGridRow,
  SuperDataGridView,
} from "./types";
export {
  SUPER_DATA_GRID_ACTIONS,
  SUPER_DATA_GRID_BADGE_COLORS,
} from "./types";
export { SUPER_DATA_GRID_AVATAR_COLORS } from "./utils/avatar";

function resolveRowId<Row extends SuperDataGridRow>(
  row: Row,
  index: number,
  getRowId?: (row: Row) => GridRowId,
): GridRowId {
  if (getRowId) return getRowId(row);
  const record = row as Record<string, unknown>;
  if (isGridRowId(record.id)) return record.id;
  if (isGridRowId(record._id)) return record._id;
  return `super-data-grid-row-${index}`;
}

/**
 * A plug-and-play MUI data grid styled after SimpliShelf's shared grid.
 * Pass column field names and object rows; the component creates column
 * definitions, display labels, and fallback row IDs for you.
 */
export function SuperDataGrid<
  Row extends SuperDataGridRow = GridValidRowModel,
>({
  columns,
  columnTypes,
  columnOptions,
  data,
  minHeight,
  beforeTable,
  density: densityProp,
  onDensityChange,
  sortingMode = "client",
  sortModel: sortModelProp,
  onSortModelChange,
  filterMode = "client",
  paginationMode = "client",
  rowCount,
  paginationModel: paginationModelProp,
  onPaginationModelChange,
  onPageChange,
  onPageSizeChange,
  filterModel: filterModelProp,
  onFilterModelChange,
  getAllData,
  onExport,
  columnVisibilityModel: columnVisibilityModelProp,
  onColumnVisibilityModelChange,
  cellComponents,
  onAction,
  views: viewsProp,
  onViewsChange,
  onViewAdded,
  onViewUpdated,
  onViewDeleted,
  onViewsOpenChange,
  onAddViewOpenChange,
  onFilterPanelOpenChange,
  selectedViewId: selectedViewIdProp,
  onSelectedViewChange,
  loading = false,
  checkboxSelection = false,
  rowSelectionModel: rowSelectionModelProp,
  onRowSelectionModelChange,
  isRowSelectable,
  getRowId,
  selectionLabel = "rows",
  getAllRows,
  includeDeleted = false,
  onIncludeDeletedChange,
  hideIncludeDeleted = false,
  onBulkDelete,
  hideBulkDelete = false,
}: SuperDataGridProps<Row>) {
  const [internalDensity, setInternalDensity] =
    useState<GridDensity>("standard");
  const density = densityProp ?? internalDensity;
  const [internalFilterModel, setInternalFilterModel] = useState<GridFilterModel>({
    items: [],
    logicOperator: GridLogicOperator.And,
  });
  const [internalSortModel, setInternalSortModel] = useState<GridSortModel>([]);
  const [internalPaginationModel, setInternalPaginationModel] =
    useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [addViewOpen, setAddViewOpen] = useState(false);
  const [editingView, setEditingView] = useState<SuperDataGridView | null>(null);
  const [viewsOpen, setViewsOpen] = useState(true);
  const [internalViews, setInternalViews] = useState<SuperDataGridView[]>([]);
  const [internalSelectedViewId, setInternalSelectedViewId] = useState<
    string | null
  >(null);
  const [internalColumnVisibilityModel, setInternalColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({});
  const columnVisibilityModel =
    columnVisibilityModelProp ?? internalColumnVisibilityModel;
  const [internalRowSelectionModel, setInternalRowSelectionModel] =
    useState<GridRowSelectionModel>(() => ({
      type: "include",
      ids: new Set(),
    }));
  const [selectionScopeOpen, setSelectionScopeOpen] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const selectionScopeOpenRef = React.useRef(false);
  const previousSelectionModelRef = React.useRef<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });
  const selectionControllerRef = React.useRef<AbortController | null>(null);

  const gridColumns = useMemo<GridColDef[]>(
    () =>
      columns.map((field) => {
        const columnType = columnTypes?.[field];
        const minWidth =
          columnType === "actions"
            ? 280
            : columnType === "address"
              ? 320
              : columnType === "peopleDetails" || columnType === "audit"
                ? 260
                : columnType === "dateTime" || columnType === "email" || columnType === "longText" || columnType === "json"
                  ? 220
                  : columnType === "phone"
                    ? 190
                    : columnType === "currency" || columnType === "date" || columnType === "image" || columnType === "badge"
                      ? 150
                : 140;
        const options = columnOptions?.[field];
        const dataType = columnType === "currency"
          ? "number"
          : columnType === "date"
            ? "date"
            : columnType === "dateTime"
              ? "dateTime"
              : columnType
                ? "string"
                : inferColumnType(field, data);

        return {
          field,
          headerName: toHeaderName(field),
          description: "Click the column header to sort",
          sortable: true,
          type: dataType,
          valueGetter: columnType
            ? (_value, row) => {
                const rawValue = row[field];
                if (columnType === "currency") {
                  return getCurrencyAmount(rawValue, options?.currency);
                }
                if (columnType === "date" || columnType === "dateTime") {
                  return parseDateValue(rawValue);
                }
                return getCommonCellSearchText(columnType, rawValue, row, field);
              }
            : undefined,
          align: "left",
          headerAlign: "left",
          flex: columnType ? 1.6 : 1,
          minWidth,
          renderCell: ({ value, row }) => {
            const rawValue = (row as Record<string, unknown>)[field];
            const CellComponent = cellComponents?.[field];
            if (CellComponent) {
              return (
                <CellComponent
                  field={field}
                  value={rawValue}
                  row={row as Row}
                />
              );
            }

            if (columnType === "peopleDetails") {
              return (
                <PeopleDetailsCell
                  value={rawValue}
                  row={row}
                  rowId={row.id}
                  showAvatar
                />
              );
            }

            if (columnType === "address") {
              return <AddressCell value={rawValue} />;
            }

            if (columnType === "audit") {
              return <AuditCell value={rawValue} row={row} field={field} />;
            }

            if (columnType === "badge") {
              return <StatusBadgeCell value={rawValue} options={options?.badge} />;
            }

            if (columnType === "currency") {
              return (
                <CurrencyCell
                  value={rawValue}
                  row={row}
                  options={options?.currency}
                />
              );
            }

            if (columnType === "date") {
              return <DateCell value={rawValue} options={options?.date} />;
            }

            if (columnType === "dateTime") {
              return <DateTimeCell value={rawValue} options={options?.dateTime} />;
            }

            if (columnType === "email") {
              return <EmailCell value={rawValue} options={options?.email} />;
            }

            if (columnType === "phone") {
              return <PhoneCell value={rawValue} options={options?.phone} />;
            }

            if (columnType === "longText") {
              return <LongTextCell value={rawValue} options={options?.longText} />;
            }

            if (columnType === "json") {
              return (
                <JsonPreviewCell
                  value={rawValue}
                  field={field}
                  options={options?.json}
                />
              );
            }

            if (columnType === "image") {
              return (
                <ImagePreviewCell
                  value={rawValue}
                  field={field}
                  options={options?.image}
                />
              );
            }

            if (columnType === "actions") {
              return (
                <ActionsCell
                  value={rawValue}
                  onAction={(action) =>
                    onAction?.({ action, field, row: row as Row })
                  }
                />
              );
            }

            return (
              <span className={styles.cellText}>
                <span className={styles.cellTextValue}>
                  {toDisplayValue(value)}
                </span>
              </span>
            );
          },
        };
      }),
    [cellComponents, columns, columnOptions, columnTypes, data, onAction],
  );

  const filterFields = useMemo(
    () => createFilterFields(gridColumns, data, columnTypes),
    [columnTypes, data, gridColumns],
  );

  const filterOnlyColumns = useMemo<GridColDef[]>(
    () =>
      filterFields
        .filter((field) => field.parentField != null)
        .map((field) => ({
          field: field.field,
          headerName: field.headerName,
          description: "Nested data filter field",
          type: field.type,
          width: 1,
          minWidth: 1,
          maxWidth: 1,
          sortable: false,
          filterable: true,
          hideable: false,
          disableColumnMenu: true,
          disableReorder: true,
          valueGetter: (_value, row) => {
            const value = getFilterFieldValue(
              row as Record<string, unknown>,
              field,
              columnTypes,
            );
            if (field.type !== "date" && field.type !== "dateTime") {
              return value;
            }
            const date = value instanceof Date ? value : new Date(String(value));
            return value == null || Number.isNaN(date.getTime()) ? null : date;
          },
        })),
    [columnTypes, filterFields],
  );

  const dataGridColumns = useMemo(
    () => [...gridColumns, ...filterOnlyColumns],
    [filterOnlyColumns, gridColumns],
  );

  const dataGridColumnVisibilityModel = useMemo(
    () => ({
      ...columnVisibilityModel,
      ...Object.fromEntries(filterOnlyColumns.map((column) => [column.field, false])),
    }),
    [columnVisibilityModel, filterOnlyColumns],
  );

  const rows = useMemo<GridValidRowModel[]>(
    () =>
      data.map((row, index) => {
        const record = { ...(row as Record<string, unknown>) };
        for (const column of gridColumns) {
          if (
            column.type === "date" &&
            typeof record[column.field] === "string"
          ) {
            const parsedDate = new Date(record[column.field] as string);
            if (!Number.isNaN(parsedDate.getTime())) {
              record[column.field] = parsedDate;
            }
          }
        }
        const rowId = resolveRowId(row as Row, index, getRowId);

        return { ...record, id: rowId };
      }),
    [data, getRowId, gridColumns],
  );

  const filterModel = filterModelProp ?? internalFilterModel;
  const sortModel = sortModelProp ?? internalSortModel;
  const resolvedPaginationModel =
    paginationModelProp ?? internalPaginationModel;
  const views = viewsProp ?? internalViews;
  const selectedViewId =
    selectedViewIdProp === undefined
      ? internalSelectedViewId
      : selectedViewIdProp;
  const rowSelectionModel =
    rowSelectionModelProp ?? internalRowSelectionModel;
  const rowSelectionModelRef = React.useRef(rowSelectionModel);
  rowSelectionModelRef.current = rowSelectionModel;
  const totalRowCount = rowCount ?? data.length;
  const selectionCount =
    rowSelectionModel.type === "exclude"
      ? Math.max(totalRowCount - rowSelectionModel.ids.size, 0)
      : rowSelectionModel.ids.size;

  const updateFilterModel = useCallback(
    (model: GridFilterModel) => {
      if (filterModelProp === undefined) setInternalFilterModel(model);
      onFilterModelChange?.(model);
    },
    [filterModelProp, onFilterModelChange],
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      if (sortModelProp === undefined) setInternalSortModel(model);
      onSortModelChange?.(model);
    },
    [onSortModelChange, sortModelProp],
  );

  const handleDensityChange = useCallback(
    (nextDensity: GridDensity) => {
      if (densityProp === undefined) setInternalDensity(nextDensity);
      onDensityChange?.(nextDensity);
    },
    [densityProp, onDensityChange],
  );

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      const publicFields = new Set(columns);
      const publicModel = Object.fromEntries(
        Object.entries(model).filter(([field]) => publicFields.has(field)),
      );
      if (columnVisibilityModelProp === undefined) {
        setInternalColumnVisibilityModel(publicModel);
      }
      onColumnVisibilityModelChange?.(publicModel);
    },
    [columnVisibilityModelProp, columns, onColumnVisibilityModelChange],
  );

  const handleFilterPanelOpenChange = useCallback(
    (open: boolean) => {
      setFilterPanelOpen(open);
      onFilterPanelOpenChange?.(open);
    },
    [onFilterPanelOpenChange],
  );

  const handleAddViewOpenChange = useCallback(
    (open: boolean) => {
      setAddViewOpen(open);
      onAddViewOpenChange?.(open);
    },
    [onAddViewOpenChange],
  );

  const handleViewsOpenChange = useCallback(
    (open: boolean) => {
      setViewsOpen(open);
      onViewsOpenChange?.(open);
    },
    [onViewsOpenChange],
  );

  const handleFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      if (selectedViewIdProp === undefined) setInternalSelectedViewId(null);
      onSelectedViewChange?.(null);
      updateFilterModel(model);
    },
    [onSelectedViewChange, selectedViewIdProp, updateFilterModel],
  );

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      if (paginationModelProp === undefined) setInternalPaginationModel(model);
      onPaginationModelChange?.(model);
      if (model.page !== resolvedPaginationModel.page) {
        onPageChange?.(model.page);
      }
      if (model.pageSize !== resolvedPaginationModel.pageSize) {
        onPageSizeChange?.(model.pageSize);
      }
    },
    [
      onPageChange,
      onPageSizeChange,
      onPaginationModelChange,
      paginationModelProp,
      resolvedPaginationModel,
    ],
  );

  const updateSelectionModel = useCallback(
    (model: GridRowSelectionModel) => {
      if (rowSelectionModelProp === undefined) {
        setInternalRowSelectionModel(model);
      }
      onRowSelectionModelChange?.(model);
    },
    [onRowSelectionModelChange, rowSelectionModelProp],
  );

  const handleRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      if (selectionScopeOpenRef.current) return;
      updateSelectionModel(model);
    },
    [updateSelectionModel],
  );

  const handleHeaderSelectionIntent = useCallback(
    (selecting: boolean) => {
      const serverSide =
        filterMode === "server" || paginationMode === "server";
      if (
        !checkboxSelection ||
        !selecting ||
        !serverSide ||
        totalRowCount <= rows.length
      ) {
        return;
      }

      previousSelectionModelRef.current = {
        type: rowSelectionModelRef.current.type,
        ids: new Set(rowSelectionModelRef.current.ids),
      };
      selectionScopeOpenRef.current = true;
      setSelectionError(null);
      setSelectionScopeOpen(true);
    },
    [checkboxSelection, filterMode, paginationMode, rows.length, totalRowCount],
  );

  const restoreSelection = useCallback(() => {
    selectionScopeOpenRef.current = false;
    setSelectionScopeOpen(false);
    setSelectionError(null);
    updateSelectionModel(previousSelectionModelRef.current);
  }, [updateSelectionModel]);

  const selectCurrentPage = useCallback(() => {
    const pageIds = rows
      .filter((row) => isRowSelectable?.({ row: row as Row }) ?? true)
      .map((row) => row.id);
    const previous = previousSelectionModelRef.current;
    let nextModel: GridRowSelectionModel;

    if (previous.type === "exclude") {
      const excludedIds = new Set(previous.ids);
      pageIds.forEach((id) => excludedIds.delete(id));
      nextModel = { type: "exclude", ids: excludedIds };
    } else {
      nextModel = {
        type: "include",
        ids: new Set([...previous.ids, ...pageIds]),
      };
    }

    selectionScopeOpenRef.current = false;
    setSelectionScopeOpen(false);
    updateSelectionModel(nextModel);
  }, [isRowSelectable, rows, updateSelectionModel]);

  const selectAllMatchingRows = useCallback(async () => {
    if (getAllRows == null) {
      const allSelection: GridRowSelectionModel = {
        type: "exclude",
        ids: new Set(),
      };
      selectionScopeOpenRef.current = false;
      setSelectionScopeOpen(false);
      updateSelectionModel(allSelection);
      return;
    }

    selectionControllerRef.current?.abort();
    const controller = new AbortController();
    selectionControllerRef.current = controller;
    setSelectingAll(true);
    setSelectionError(null);

    try {
      const matchingRows = await getAllRows({
        filterModel,
        paginationModel: resolvedPaginationModel,
        includeDeleted,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const selectableIds = matchingRows.flatMap((row, index) =>
        isRowSelectable?.({ row }) ?? true
          ? [resolveRowId(row, index, getRowId)]
          : [],
      );
      const previous = previousSelectionModelRef.current;
      let nextModel: GridRowSelectionModel;

      if (previous.type === "exclude") {
        const excludedIds = new Set(previous.ids);
        selectableIds.forEach((id) => excludedIds.delete(id));
        nextModel = { type: "exclude", ids: excludedIds };
      } else {
        nextModel = {
          type: "include",
          ids: new Set([...previous.ids, ...selectableIds]),
        };
      }

      selectionScopeOpenRef.current = false;
      setSelectionScopeOpen(false);
      updateSelectionModel(nextModel);
    } catch (error) {
      if (!controller.signal.aborted) {
        setSelectionError(
          error instanceof Error
            ? error.message
            : "Could not select all matching rows.",
        );
      }
    } finally {
      if (selectionControllerRef.current === controller) {
        selectionControllerRef.current = null;
      }
      if (!controller.signal.aborted) setSelectingAll(false);
    }
  }, [
    filterModel,
    getAllRows,
    getRowId,
    includeDeleted,
    isRowSelectable,
    resolvedPaginationModel,
    updateSelectionModel,
  ]);

  const clearSelection = useCallback(() => {
    selectionScopeOpenRef.current = false;
    selectionControllerRef.current?.abort();
    setSelectingAll(false);
    setSelectionScopeOpen(false);
    setSelectionError(null);
    const emptySelection: GridRowSelectionModel = {
      type: "include",
      ids: new Set(),
    };
    previousSelectionModelRef.current = emptySelection;
    updateSelectionModel(emptySelection);
  }, [updateSelectionModel]);

  const confirmBulkDelete = useCallback(async () => {
    if (onBulkDelete == null) return;

    const loadedSelectedRows = data.filter((row, index) => {
      if (isRowSelectable?.({ row }) === false) return false;
      const id = resolveRowId(row, index, getRowId);
      return rowSelectionModel.type === "include"
        ? rowSelectionModel.ids.has(id)
        : !rowSelectionModel.ids.has(id);
    });
    const request: SuperDataGridBulkDeleteRequest<Row> = {
      rowSelectionModel: {
        type: rowSelectionModel.type,
        ids: new Set(rowSelectionModel.ids),
      },
      filterModel,
      paginationModel: resolvedPaginationModel,
      includeDeleted,
      selectedCount: selectionCount,
      loadedSelectedRows,
    };

    await onBulkDelete(request);
    clearSelection();
  }, [
    clearSelection,
    data,
    filterModel,
    getRowId,
    includeDeleted,
    isRowSelectable,
    onBulkDelete,
    resolvedPaginationModel,
    rowSelectionModel,
    selectionCount,
  ]);

  useEffect(() => {
    const abortSelection = () => selectionControllerRef.current?.abort();
    window.addEventListener("pagehide", abortSelection);
    return () => {
      window.removeEventListener("pagehide", abortSelection);
      abortSelection();
    };
  }, []);

  const handleViewsChange = useCallback(
    (nextViews: SuperDataGridView[]) => {
      if (viewsProp === undefined) setInternalViews(nextViews);
      onViewsChange?.(nextViews);
    },
    [onViewsChange, viewsProp],
  );

  const selectView = useCallback(
    (view: SuperDataGridView | null) => {
      const nextViewId = view?.id ?? null;
      if (selectedViewIdProp === undefined) {
        setInternalSelectedViewId(nextViewId);
      }
      onSelectedViewChange?.(nextViewId);
      updateFilterModel(
        view?.filterModel ?? {
          items: [],
          logicOperator: GridLogicOperator.And,
        },
      );
    },
    [onSelectedViewChange, selectedViewIdProp, updateFilterModel],
  );

  const handleAddView = useCallback(
    (name: string, notes: string, viewFilterModel: GridFilterModel) => {
      const view: SuperDataGridView = {
        id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        ...(notes ? { notes } : {}),
        filterModel: {
          ...viewFilterModel,
          items: viewFilterModel.items.map((item) => ({ ...item })),
        },
      };
      handleViewsChange([...views, view]);
      onViewAdded?.(view);
      selectView(view);
      setEditingView(null);
      handleAddViewOpenChange(false);
    },
    [
      handleAddViewOpenChange,
      handleViewsChange,
      onViewAdded,
      selectView,
      views,
    ],
  );

  const handleUpdateView = useCallback(
    (name: string, notes: string, viewFilterModel: GridFilterModel) => {
      if (!editingView) return;
      const updatedView: SuperDataGridView = {
        ...editingView,
        name,
        ...(notes ? { notes } : { notes: undefined }),
        filterModel: {
          ...viewFilterModel,
          items: viewFilterModel.items.map((item) => ({ ...item })),
        },
      };
      handleViewsChange(
        views.map((view) => (view.id === updatedView.id ? updatedView : view)),
      );
      onViewUpdated?.(updatedView);
      if (selectedViewId === updatedView.id) selectView(updatedView);
      setEditingView(null);
      handleAddViewOpenChange(false);
    },
    [
      editingView,
      handleAddViewOpenChange,
      handleViewsChange,
      onViewUpdated,
      selectView,
      selectedViewId,
      views,
    ],
  );

  const handleSaveView = useCallback(
    (name: string, notes: string, viewFilterModel: GridFilterModel) => {
      if (editingView) {
        handleUpdateView(name, notes, viewFilterModel);
      } else {
        handleAddView(name, notes, viewFilterModel);
      }
    },
    [editingView, handleAddView, handleUpdateView],
  );

  const handleDeleteView = useCallback(
    (view: SuperDataGridView) => {
      handleViewsChange(views.filter((item) => item.id !== view.id));
      onViewDeleted?.(view);
      if (selectedViewId === view.id) selectView(null);
    },
    [handleViewsChange, onViewDeleted, selectView, selectedViewId, views],
  );

  useEffect(() => {
    if (selectedViewIdProp === undefined) return;
    const selectedView =
      selectedViewIdProp == null
        ? null
        : views.find((view) => view.id === selectedViewIdProp);
    if (selectedViewIdProp != null && selectedView == null) return;
    updateFilterModel(
      selectedView?.filterModel ?? {
        items: [],
        logicOperator: GridLogicOperator.And,
      },
    );
  }, [selectedViewIdProp, updateFilterModel, views]);

  const contextValue = useMemo(
    () => ({
      columns: gridColumns,
      beforeTable,
      rows,
      density,
      onDensityChange: handleDensityChange,
      filterModel,
      filterMode,
      paginationMode,
      paginationModel: resolvedPaginationModel,
      getAllData,
      onExport,
      views,
      selectedViewId,
      viewsOpen,
      checkboxSelection,
      includeDeleted,
      selectionLabel,
      showIncludeDeleted:
        onIncludeDeletedChange != null && !hideIncludeDeleted,
      onIncludeDeletedChange,
      selectionCount,
      canBulkDelete:
        checkboxSelection && onBulkDelete != null && !hideBulkDelete,
      onBulkDelete: confirmBulkDelete,
      onHeaderSelectionIntent: handleHeaderSelectionIntent,
      onClearSelection: clearSelection,
      columnVisibilityModel,
      onColumnVisibilityModelChange: handleColumnVisibilityModelChange,
      onFilterClick: () => handleFilterPanelOpenChange(true),
      onToggleViews: () => handleViewsOpenChange(!viewsOpen),
    }),
    [
      beforeTable,
      columnVisibilityModel,
      handleColumnVisibilityModelChange,
      handleDensityChange,
      handleFilterPanelOpenChange,
      handleViewsOpenChange,
      density,
      filterMode,
      filterModel,
      getAllData,
      onExport,
      handleHeaderSelectionIntent,
      clearSelection,
      confirmBulkDelete,
      gridColumns,
      paginationMode,
      resolvedPaginationModel,
      rows,
      selectedViewId,
      checkboxSelection,
      selectionCount,
      includeDeleted,
      selectionLabel,
      onIncludeDeletedChange,
      hideIncludeDeleted,
      onBulkDelete,
      hideBulkDelete,
      views,
      viewsOpen,
    ],
  );

  const densityClass =
    density === "compact"
      ? styles.compact
      : density === "comfortable"
        ? styles.comfortable
        : "";
  const workspaceStyle =
    minHeight == null
      ? undefined
      : ({
          "--super-data-grid-min-height":
            typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        } as React.CSSProperties);

  return (
    <div
      className={`${styles.gridWorkspace} ${densityClass}`}
      style={workspaceStyle}
    >
      <div
        className={`${styles.viewsSidebarSlot} ${
          viewsOpen ? "" : styles.viewsSidebarSlotClosed
        }`}
        aria-hidden={!viewsOpen}
      >
        <SuperDataGridViewsSidebar
          views={views}
          selectedViewId={selectedViewId}
          onAdd={() => {
            setEditingView(null);
            handleAddViewOpenChange(true);
          }}
          onSelect={selectView}
          onEdit={(view) => {
            setEditingView(view);
            handleAddViewOpenChange(true);
          }}
          onDelete={handleDeleteView}
        />
      </div>
      <div className={styles.gridFrame}>
        <SuperDataGridContext.Provider value={contextValue}>
          <DataGrid
            className={styles.gridRoot}
            rows={rows}
            columns={dataGridColumns}
            columnHeaderHeight={getColumnHeaderHeight(gridColumns)}
            density={density}
            sortingMode={sortingMode}
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            filterMode={filterMode}
            paginationMode={paginationMode}
            paginationModel={resolvedPaginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            rowCount={
              paginationMode === "server" ? rowCount ?? data.length : undefined
            }
            loading={loading}
            getRowHeight={() => "auto"}
            getEstimatedRowHeight={() => 76}
            onDensityChange={handleDensityChange}
            filterModel={filterModel}
            onFilterModelChange={handleFilterModelChange}
            columnVisibilityModel={dataGridColumnVisibilityModel}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            rowSelection={checkboxSelection}
            disableRowSelectionOnClick
            checkboxSelection={checkboxSelection}
            rowSelectionModel={
              checkboxSelection ? rowSelectionModel : undefined
            }
            onRowSelectionModelChange={handleRowSelectionModelChange}
            keepNonExistentRowsSelected={checkboxSelection}
            isRowSelectable={
              checkboxSelection && isRowSelectable != null
                ? ({ row }) => isRowSelectable?.({ row: row as Row }) ?? true
                : undefined
            }
            disableColumnMenu
            disableColumnResize
            showToolbar
            slots={{
              toolbar: SuperDataGridToolbar,
              pagination: SuperDataGridPagination,
              loadingOverlay: SuperDataGridLoadingOverlay,
            }}
            getRowClassName={({ indexRelativeToCurrentPage }) =>
              indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
            }
          />
        </SuperDataGridContext.Provider>
      </div>
      <SuperDataGridFilterPanel
        open={filterPanelOpen}
        columns={filterFields}
        filterModel={filterModel}
        onClose={() => handleFilterPanelOpenChange(false)}
        onApply={handleFilterModelChange}
      />
      <SuperDataGridAddViewDialog
        open={addViewOpen}
        columns={filterFields}
        initialView={editingView}
        onClose={() => handleAddViewOpenChange(false)}
        onSave={handleSaveView}
      />
      <SuperDataGridSelectionScopeDialog
        open={selectionScopeOpen}
        itemLabel={selectionLabel}
        currentPageCount={rows.length}
        totalCount={totalRowCount}
        canSelectAll={getAllRows != null || isRowSelectable == null}
        selectingAll={selectingAll}
        error={selectionError}
        onClose={restoreSelection}
        onSelectCurrentPage={selectCurrentPage}
        onSelectAll={() => void selectAllMatchingRows()}
      />
    </div>
  );
}

export default SuperDataGrid;
