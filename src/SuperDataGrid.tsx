import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  DataGrid,
  GridLogicOperator,
  type GridCellParams,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridDensity,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowClassNameParams,
  type GridRowId,
  type GridRowParams,
  type GridRowSelectionModel,
  type GridSortModel,
  type GridValidRowModel,
  useGridApiRef,
} from "@mui/x-data-grid";
import SuperDataGridFilterPanel from "./components/SuperDataGridFilterPanel";
import SuperDataGridPagination, {
  PAGE_SIZE_OPTIONS,
} from "./components/SuperDataGridPagination";
import SuperDataGridLoadingOverlay from "./components/SuperDataGridLoadingOverlay";
import SuperDataGridNoRowsOverlay from "./components/SuperDataGridNoRowsOverlay";
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
import PriceBreakdownCell from "./components/cells/PriceBreakdownCell";
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
import { createUniqueId } from "./utils/uniqueId";
import type {
  SuperDataGridBulkDeleteRequest,
  SuperDataGridColumnOptions,
  SuperDataGridColumnType,
  SuperDataGridFilterField,
  SuperDataGridProps,
  SuperDataGridRow,
  SuperDataGridView,
} from "./types";
import styles from "./styles/grid.module.css";
import { muiControlUtilities } from "./styles/tailwindClasses";

const isWideDesktopViewport = (): boolean =>
  typeof window === "undefined" || window.innerWidth >= 1536;
const shouldSizeColumnsToContent = (): boolean =>
  typeof window === "undefined" ||
  window.innerWidth < 1280 ||
  window.innerWidth >= 1536;
const EMPTY_AUTO_SIZED_WIDTHS: Readonly<Record<string, number>> = Object.freeze({});

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
  SuperDataGridColumnConfiguration,
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
  SuperDataGridPriceBreakdown,
  SuperDataGridPriceBreakdownOptions,
  SuperDataGridPriceBreakdownLine,
  SuperDataGridProductImage,
  SuperDataGridExportFormat,
  SuperDataGridExportRequest,
  SuperDataGridExportScope,
  SuperDataGridFilterField,
  SuperDataGridProps,
  SuperDataGridRow,
  SuperDataGridView,
} from "./types";
export type { GridActionAppearance, GridActionButtonProps } from "./components/GridActionButton";
export type { GridActionBarProps } from "./components/GridActionBar";
export type {
  GridActionDefinition,
  GridActionsCellClasses,
  GridActionsCellProps,
} from "./components/GridActionsCell";
export type {
  SuperDataGridHostActionsClasses,
  SuperDataGridHostActionsProps,
} from "./components/SuperDataGridHostActions";
export {
  SUPER_DATA_GRID_ACTIONS,
  SUPER_DATA_GRID_BADGE_COLORS,
} from "./types";
export { SUPER_DATA_GRID_AVATAR_COLORS } from "./utils/avatar";
export { SUPER_DATA_GRID_PRODUCT_IMAGE_FIELDS } from "./utils/predefinedCellData";

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

function getDensityClass(density: GridDensity): string {
  if (density === "compact") return styles.compact;
  if (density === "comfortable") return styles.comfortable;
  return "";
}

const getDefaultRowClassName = ({
  indexRelativeToCurrentPage,
}: GridRowClassNameParams): string =>
  indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd";

function getGridColumnType<Row extends SuperDataGridRow>(
  field: string,
  columnType: SuperDataGridColumnType | undefined,
  data: readonly Row[],
): GridColDef["type"] {
  if (columnType === "currency" || columnType === "priceBreakdown") return "number";
  if (columnType === "date") return "date";
  if (columnType === "dateTime") return "dateTime";
  if (columnType) return "string";
  return inferColumnType(field, data);
}

function usesMonospacedFont(
  field: string,
  columnType: SuperDataGridColumnType | undefined,
): boolean {
  return columnType === "date" || columnType === "dateTime" ||
    /(?:id|code|timestamp|date|time|at)$/i.test(field);
}

function getGridValueGetter(
  field: string,
  columnType: SuperDataGridColumnType | undefined,
  options: SuperDataGridColumnOptions | undefined,
): GridColDef["valueGetter"] {
  if (!columnType) return undefined;
  return (_value, row) => {
    const rawValue = (row as Record<string, unknown>)[field];
    if (columnType === "currency") {
      return getCurrencyAmount(rawValue, options?.currency);
    }
    if (columnType === "priceBreakdown") {
      const record = rawValue && typeof rawValue === "object"
        ? rawValue as Record<string, unknown>
        : null;
      return getCurrencyAmount(
        record?.grandTotal ?? record?.total,
        options?.priceBreakdown,
      );
    }
    if (columnType === "date" || columnType === "dateTime") {
      return parseDateValue(rawValue);
    }
    return getCommonCellSearchText(columnType, rawValue, row, field);
  };
}

function renderGridCell<Row extends SuperDataGridRow>(
  field: string,
  columnType: SuperDataGridColumnType | undefined,
  options: SuperDataGridColumnOptions | undefined,
  components: SuperDataGridProps<Row>["cellComponents"],
  onAction: SuperDataGridProps<Row>["onAction"],
  value: unknown,
  row: Row,
): React.ReactNode {
  const rawValue = (row as Record<string, unknown>)[field];
  const CellComponent = components?.[field];
  if (CellComponent) return <CellComponent field={field} value={rawValue} row={row} />;

  switch (columnType) {
    case "peopleDetails":
      return <PeopleDetailsCell value={rawValue} row={row} rowId={(row as GridValidRowModel).id} showAvatar />;
    case "address":
      return <AddressCell value={rawValue} />;
    case "audit":
      return <AuditCell value={rawValue} row={row} field={field} />;
    case "badge":
      return <StatusBadgeCell value={rawValue} options={options?.badge} />;
    case "currency":
      return <CurrencyCell value={rawValue} row={row} options={options?.currency} />;
    case "date":
      return <DateCell value={rawValue} options={options?.date} />;
    case "dateTime":
      return <DateTimeCell value={rawValue} options={options?.dateTime} />;
    case "email":
      return <EmailCell value={rawValue} options={options?.email} />;
    case "phone":
      return <PhoneCell value={rawValue} options={options?.phone} />;
    case "longText":
      return <LongTextCell value={rawValue} options={options?.longText} />;
    case "json":
      return <JsonPreviewCell value={rawValue} field={field} options={options?.json} />;
    case "image":
      return <ImagePreviewCell value={rawValue} field={field} row={row} options={options?.image} />;
    case "priceBreakdown":
      return <PriceBreakdownCell value={rawValue} row={row} options={options?.priceBreakdown} />;
    case "actions":
      return <ActionsCell value={rawValue} onAction={(action) => onAction?.({ action, field, row })} />;
    default:
      return (
        <span className={styles.cellText}>
          <span className={styles.cellTextValue}>{toDisplayValue(value)}</span>
        </span>
      );
  }
}

function createGridColumn<Row extends SuperDataGridRow>(
  field: string,
  data: readonly Row[],
  autoSizedWidths: Readonly<Record<string, number>>,
  flexSizingReady: boolean,
  sizeColumnsToContent: boolean,
  columnConfiguration: SuperDataGridProps<Row>["columnConfiguration"],
  columnTypes: SuperDataGridProps<Row>["columnTypes"],
  columnOptions: SuperDataGridProps<Row>["columnOptions"],
  cellComponents: SuperDataGridProps<Row>["cellComponents"],
  onAction: SuperDataGridProps<Row>["onAction"],
): GridColDef {
  const columnType = columnTypes?.[field];
  const options = columnOptions?.[field];
  const configuration = columnConfiguration?.[field];
  const monospaceCell = usesMonospacedFont(field, columnType);
  const canFlex = configuration?.width == null;
  const flex = canFlex && flexSizingReady
    ? configuration?.flex ?? 1
    : undefined;
  const measuredWidth = autoSizedWidths[field];
  const configuredCellClassName = configuration?.cellClassName;
  const cellBaseClassName = monospaceCell ? styles.monospaceCell : "";
  const cellClassName: GridColDef["cellClassName"] =
    typeof configuredCellClassName === "function"
      ? (params: GridCellParams) =>
          [cellBaseClassName, configuredCellClassName(params)].filter(Boolean).join(" ")
      : [cellBaseClassName, configuredCellClassName ?? ""].filter(Boolean).join(" ") || undefined;
  return {
    field,
    headerName: configuration?.headerName ?? toHeaderName(field),
    description: configuration?.description ?? "Click the column header to sort",
    sortable: configuration?.sortable ?? true,
    type: getGridColumnType(field, columnType, data),
    valueGetter: getGridValueGetter(field, columnType, options),
    align: configuration?.align ?? "left",
    headerAlign: configuration?.headerAlign ?? "left",
    // Measure unconstrained columns against the current page first, then use
    // flex ratios to share the available grid width without clipping content.
    flex,
    width: configuration?.width ?? (
      flexSizingReady && flex == null ? measuredWidth : undefined
    ),
    minWidth: flex == null
      ? configuration?.minWidth
      : sizeColumnsToContent
        ? Math.max(configuration?.minWidth ?? 0, measuredWidth ?? 0)
        : configuration?.minWidth ?? 50,
    maxWidth: configuration?.maxWidth,
    hideable: configuration?.hideable,
    cellClassName,
    headerClassName: configuration?.headerClassName,
    renderCell: ({ value, row }) => renderGridCell(
      field,
      columnType,
      options,
      cellComponents,
      onAction,
      value,
      row as Row,
    ),
  };
}

type GridWorkspaceStyle = React.CSSProperties & {
  "--super-data-grid-min-height"?: string;
  "--super-data-grid-height"?: string;
};

function getGridWorkspaceStyle(
  minHeight: number | string | undefined,
  height: number | string | undefined,
): GridWorkspaceStyle | undefined {
  if (minHeight == null && height == null) return undefined;

  return {
    ...(minHeight == null
      ? {}
      : {
          "--super-data-grid-min-height":
            typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        }),
    ...(height == null
      ? {}
      : {
          "--super-data-grid-height":
            typeof height === "number" ? `${height}px` : height,
        }),
  };
}

function useAutoSizeColumns(
  apiRef: ReturnType<typeof useGridApiRef>,
  columnFieldsKey: string,
  loading: boolean,
  dataKey: string,
  columnDefinitionsKey: string,
  onWidthsMeasured: (widths: Record<string, number>) => void,
): { isAutoSizing: boolean; measuredKey: string | null } {
  const lastAutoSizeKey = React.useRef<string | null>(null);
  const [isAutoSizing, setIsAutoSizing] = useState(false);
  const [measuredKey, setMeasuredKey] = useState<string | null>(null);

  useEffect(() => {
    if (loading || columnFieldsKey.length === 0) {
      setIsAutoSizing(false);
      return undefined;
    }

    const autoSizeKey = `${columnFieldsKey}\u0001${dataKey}\u0001${columnDefinitionsKey}`;
    if (lastAutoSizeKey.current === autoSizeKey) return undefined;

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    setIsAutoSizing(true);

    // MUI measures mounted cells. Temporarily disable row virtualization so
    // every row from this server page participates in the width calculation.
    // Two frames allow the grid to mount those rows before measuring them.
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const api = apiRef.current;
        if (api == null) {
          setIsAutoSizing(false);
          return;
        }

        void api.autosizeColumns({
          columns: columnFieldsKey.split("\u0000"),
          includeHeaders: true,
          includeOutliers: true,
          disableColumnVirtualization: true,
        }).then(
          () => {
            onWidthsMeasured(resizeColumnsToRenderedContent(
              api,
              columnFieldsKey.split("\u0000"),
            ));
            if (!cancelled) {
              lastAutoSizeKey.current = autoSizeKey;
              setMeasuredKey(autoSizeKey);
            }
          },
          () => {
            if (cancelled) return;
            onWidthsMeasured(resizeColumnsToRenderedContent(
              api,
              columnFieldsKey.split("\u0000"),
            ));
            lastAutoSizeKey.current = autoSizeKey;
            setMeasuredKey(autoSizeKey);
          },
        ).finally(() => {
          if (!cancelled) setIsAutoSizing(false);
        });
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [apiRef, columnDefinitionsKey, columnFieldsKey, dataKey, lastAutoSizeKey, loading, onWidthsMeasured]);

  return { isAutoSizing, measuredKey };
}

/**
 * MUI measures the cell box during autosizing. Custom cell renderers can
 * overflow that box while still reporting its default width, so also inspect
 * each currently rendered cell's scroll width. At this point row
 * virtualization is disabled and `data` contains only the current page.
 */
function resizeColumnsToRenderedContent(
  api: NonNullable<ReturnType<typeof useGridApiRef>["current"]>,
  fields: readonly string[],
): Record<string, number> {
  const root = api.rootElementRef.current;
  if (root == null) return {};

  const cells = Array.from(
    root.querySelectorAll<HTMLElement>(`.MuiDataGrid-cell[data-field]`),
  );
  const widths: Record<string, number> = {};

  for (const field of fields) {
    const column = api.getColumn(field);
    if (column == null) continue;

    const cellWidth = cells.reduce((widest, cell) =>
      cell.dataset.field === field ? Math.max(widest, cell.scrollWidth) : widest,
    0);
    const header = api.getColumnHeaderElement(field);
    if (header == null && cellWidth === 0) continue;

    const contentWidth = Math.max(cellWidth, header?.scrollWidth ?? 0);
    const minWidth = column.minWidth ?? 0;
    const maxWidth = column.maxWidth ?? Number.POSITIVE_INFINITY;
    const currentWidth = column.computedWidth;
    const measuredWidth = Math.min(
      maxWidth,
      Math.max(minWidth, currentWidth, contentWidth),
    );

    widths[field] = measuredWidth;
  }

  return widths;
}

function getAutoSizeValueSignature(value: unknown, depth = 0): string {
  if (value == null) return String(value);
  if (value instanceof Date) return `date:${value.getTime()}`;
  if (typeof value === "string") return `string:${JSON.stringify(value)}`;
  if (typeof value === "number" || typeof value === "boolean") {
    return `${typeof value}:${String(value)}`;
  }
  if (depth >= 4 && typeof value === "object") {
    return `object-keys:${Object.keys(value).sort().join(",")}`;
  }
  if (Array.isArray(value)) {
    return `array:${JSON.stringify(value.map((item) =>
      getAutoSizeValueSignature(item, depth + 1),
    ))}`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, getAutoSizeValueSignature(item, depth + 1)]);
    return `object:${JSON.stringify(entries)}`;
  }
  return `${typeof value}:${String(value)}`;
}

function hashAutoSizeSignature(signature: string): string {
  let hash = 2166136261;
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${signature.length}:${(hash >>> 0).toString(36)}`;
}

function getAutoSizeDataKey<Row extends SuperDataGridRow>(
  data: readonly Row[],
): string {
  return data.map((row, index) => {
    if (row == null || typeof row !== "object") {
      return `${index}:${hashAutoSizeSignature(getAutoSizeValueSignature(row))}`;
    }
    const record = row as Record<string, unknown>;
    const rowId = record.id ?? record._id ?? record.userId ?? index;
    const fieldValues = Object.keys(record)
      .sort((left, right) => left.localeCompare(right))
      .map((field) => [field, getAutoSizeValueSignature(record[field])]);
    const stableRowId =
      typeof rowId === "string" || typeof rowId === "number"
        ? `${typeof rowId}:${rowId}`
        : `index:${index}`;
    return `${stableRowId}:${hashAutoSizeSignature(JSON.stringify(fieldValues))}`;
  }).join("\u0000");
}

/**
 * A plug-and-play MUI data grid styled after SimpliShelf's shared grid.
 * Pass column field names and object rows; the component creates column
 * definitions, display labels, and fallback row IDs for you.
 */
export function SuperDataGrid<
  Row extends SuperDataGridRow = GridValidRowModel,
>({
  className,
  gridClassName,
  cellClassName,
  columnHeaderClassName,
  rowClassName,
  columns,
  columnConfiguration,
  columnTypes,
  columnOptions,
  filterFields: suppliedFilterFields,
  filterFieldsMode = "merge",
  data,
  minHeight,
  height,
  columnGroupingModel,
  rowHeight,
  getRowHeight,
  getEstimatedRowHeight,
  getRowClassName,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  hideFooter = false,
  hideFooterSelectedRowCount = true,
  hideToolbar = false,
  dataGridSlots,
  beforeTable,
  toolbarActions,
  onResetToDefault,
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
  hideViews = false,
  canAddViews = true,
  canEditViews = true,
  canDeleteViews = true,
  onViewsChange,
  onViewAdded,
  onViewUpdated,
  onViewDeleted,
  onViewsOpenChange,
  onAddViewOpenChange,
  onFilterPanelOpenChange,
  selectedViewId: selectedViewIdProp,
  separateViewFilters = false,
  onSelectedViewChange,
  loading = false,
  checkboxSelection = false,
  rowSelectionModel: rowSelectionModelProp,
  disableRowSelectionExcludeModel = false,
  onRowSelectionModelChange,
  isRowSelectable,
  getRowId,
  selectionLabel = "rows",
  getAllRows,
  includeDeleted = false,
  onIncludeDeletedChange,
  hideIncludeDeleted = false,
  onBulkDelete,
  bulkDeleteLabel = "Bulk delete",
  hideBulkDelete = false,
}: Readonly<SuperDataGridProps<Row>>) {
  const apiRef = useGridApiRef();
  const viewsSidebarId = useId();
  const [autoSizedWidths, setAutoSizedWidths] = useState<Record<string, number>>({});
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
  const knownFilterFieldsRef = React.useRef<SuperDataGridFilterField[]>([]);
  const [addViewOpen, setAddViewOpen] = useState(false);
  const [editingView, setEditingView] = useState<SuperDataGridView | null>(null);
  const [viewsOpen, setViewsOpen] = useState(isWideDesktopViewport);
  const wideDesktopViewportRef = React.useRef(isWideDesktopViewport());
  const [sizeColumnsToContent, setSizeColumnsToContent] = useState(
    shouldSizeColumnsToContent,
  );
  const sizeColumnsToContentRef = React.useRef(shouldSizeColumnsToContent());
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
  const updateAutoSizedWidths = useCallback(
    (measuredWidths: Record<string, number>) => {
      setAutoSizedWidths((currentWidths) => {
        let changed = false;
        const nextWidths = { ...currentWidths };
        for (const [field, width] of Object.entries(measuredWidths)) {
          if (Math.abs((currentWidths[field] ?? 0) - width) > 1) {
            nextWidths[field] = width;
            changed = true;
          }
        }
        return changed ? nextWidths : currentWidths;
      });
    },
    [],
  );

  const autoSizeColumnFields = useMemo(
    () => columns.filter((field) =>
      columnConfiguration?.[field]?.width == null,
    ),
    [columnConfiguration, columns],
  );
  const autoSizeColumnFieldsKey = autoSizeColumnFields.join("\u0000");
  const autoSizeDataKey = useMemo(
    () => getAutoSizeDataKey(data),
    [data],
  );
  const autoSizeColumnDefinitionsKey = useMemo(
    () => createUniqueId("columns"),
    [cellComponents, columnConfiguration, columnOptions, columnTypes, columns],
  );
  const autoSizeKey = `${autoSizeColumnFieldsKey}\u0001${autoSizeDataKey}\u0001${autoSizeColumnDefinitionsKey}`;
  const { isAutoSizing, measuredKey } = useAutoSizeColumns(
    apiRef,
    sizeColumnsToContent ? autoSizeColumnFieldsKey : "",
    loading,
    autoSizeDataKey,
    autoSizeColumnDefinitionsKey,
    updateAutoSizedWidths,
  );
  const flexSizingReady =
    !sizeColumnsToContent ||
    autoSizeColumnFields.length === 0 ||
    measuredKey === autoSizeKey;
  const widthsForCurrentViewport = sizeColumnsToContent
    ? autoSizedWidths
    : EMPTY_AUTO_SIZED_WIDTHS;

  const gridColumns = useMemo<GridColDef[]>(
    () =>
      columns.map((field) => createGridColumn(
        field,
        data,
        widthsForCurrentViewport,
        flexSizingReady,
        sizeColumnsToContent,
        columnConfiguration,
        columnTypes,
        columnOptions,
        cellComponents,
        onAction,
      )),
    [cellComponents, columnConfiguration, columns, columnOptions, columnTypes, data, flexSizingReady, onAction, sizeColumnsToContent, widthsForCurrentViewport],
  );

  const filterFields = useMemo(
    () => {
      if (filterFieldsMode === "replace") {
        const supplied = [...(suppliedFilterFields ?? [])].filter(
          (field, index, fields) =>
            fields.findIndex((candidate) => candidate.field === field.field) === index,
        );
        knownFilterFieldsRef.current = supplied;
        return supplied;
      }

      const discovered = createFilterFields(gridColumns, data, columnTypes);
      const validParentFields = new Set(gridColumns.map((column) => column.field));
      const preservedNestedFields = knownFilterFieldsRef.current.filter(
        (field) =>
          field.parentField != null && validParentFields.has(field.parentField),
      );
      const combined = [
        ...discovered,
        ...preservedNestedFields,
        ...(suppliedFilterFields ?? []),
      ].filter(
        (field, index, fields) =>
          fields.findIndex((candidate) => candidate.field === field.field) === index,
      );
      knownFilterFieldsRef.current = combined;
      return combined;
    },
    [columnTypes, data, filterFieldsMode, gridColumns, suppliedFilterFields],
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

  useEffect(() => {
    const synchronizeViewsBreakpoint = (): void => {
      const isWideDesktop = window.innerWidth >= 1536;
      if (isWideDesktop !== wideDesktopViewportRef.current) {
        wideDesktopViewportRef.current = isWideDesktop;
        setViewsOpen(isWideDesktop);
      }

      const shouldSizeToContent = shouldSizeColumnsToContent();
      if (shouldSizeToContent !== sizeColumnsToContentRef.current) {
        sizeColumnsToContentRef.current = shouldSizeToContent;
        setSizeColumnsToContent(shouldSizeToContent);
      }
    };

    window.addEventListener("resize", synchronizeViewsBreakpoint);
    return () => window.removeEventListener("resize", synchronizeViewsBreakpoint);
  }, []);

  const handleFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      if (!separateViewFilters) {
        if (selectedViewIdProp === undefined) setInternalSelectedViewId(null);
        onSelectedViewChange?.(null);
      }
      updateFilterModel(model);
    },
    [onSelectedViewChange, selectedViewIdProp, separateViewFilters, updateFilterModel],
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
      if (!separateViewFilters) {
        updateFilterModel(
          view?.filterModel ?? {
            items: [],
            logicOperator: GridLogicOperator.And,
          },
        );
      }
    },
    [onSelectedViewChange, selectedViewIdProp, separateViewFilters, updateFilterModel],
  );

  const handleAddView = useCallback(
    (name: string, notes: string, viewFilterModel: GridFilterModel) => {
      if (!canAddViews) return;
      const view: SuperDataGridView = {
        id: createUniqueId("view"),
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
      canAddViews,
      handleViewsChange,
      onViewAdded,
      selectView,
      views,
    ],
  );

  const handleUpdateView = useCallback(
    (name: string, notes: string, viewFilterModel: GridFilterModel) => {
      if (!editingView || !canEditViews) return;
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
      canEditViews,
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
      if (!canDeleteViews) return;
      handleViewsChange(views.filter((item) => item.id !== view.id));
      onViewDeleted?.(view);
      if (selectedViewId === view.id) selectView(null);
    },
    [canDeleteViews, handleViewsChange, onViewDeleted, selectView, selectedViewId, views],
  );

  useEffect(() => {
    if (selectedViewIdProp === undefined || separateViewFilters) return;
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
  }, [selectedViewIdProp, separateViewFilters, updateFilterModel, views]);

  const contextValue = useMemo(
    () => ({
      columns: gridColumns,
      beforeTable,
      toolbarActions,
      onResetToDefault,
      rows,
      density,
      onDensityChange: handleDensityChange,
      filterModel,
      filterMode,
      paginationMode,
      paginationModel: resolvedPaginationModel,
      pageSizeOptions,
      getAllData,
      onExport,
      views,
      selectedViewId,
      viewsOpen,
      hideViews,
      checkboxSelection,
      includeDeleted,
      selectionLabel,
      showIncludeDeleted:
        onIncludeDeletedChange != null && !hideIncludeDeleted,
      onIncludeDeletedChange,
      selectionCount,
      bulkDeleteLabel,
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
      toolbarActions,
      onResetToDefault,
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
      pageSizeOptions,
      rows,
      selectedViewId,
      hideViews,
      checkboxSelection,
      selectionCount,
      bulkDeleteLabel,
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

  const handleGridRowSelectable = useCallback(
    ({ row }: GridRowParams) =>
      isRowSelectable?.({ row: row as Row }) ?? true,
    [isRowSelectable],
  );
  const gridSlots = useMemo(
    () => ({
      toolbar: hideToolbar ? undefined : SuperDataGridToolbar,
      pagination: SuperDataGridPagination,
      loadingOverlay: dataGridSlots?.loadingOverlay ?? SuperDataGridLoadingOverlay,
      noRowsOverlay: dataGridSlots?.noRowsOverlay ?? SuperDataGridNoRowsOverlay,
    }),
    [
      dataGridSlots?.loadingOverlay,
      dataGridSlots?.noRowsOverlay,
      hideToolbar,
    ],
  );

  const densityClass = getDensityClass(density);
  const workspaceStyle = getGridWorkspaceStyle(minHeight, height);

  return (
    <div
      className={`super-data-grid ${styles.gridWorkspace} ${densityClass} ${muiControlUtilities} tw:font-sans tw:relative tw:flex tw:w-full tw:items-stretch tw:gap-3.5 tw:py-4 tw:[&_.MuiPaginationItem-root]:rounded-lg tw:[&_.MuiPaginationItem-root]:font-semibold tw:[&_.MuiPaginationItem-root.Mui-selected]:border-blue-600 tw:[&_.MuiPaginationItem-root.Mui-selected]:bg-blue-600 tw:[&_.MuiPaginationItem-root.Mui-selected]:text-white tw:hover:[&_.MuiPaginationItem-root.Mui-selected]:bg-blue-700 ${className ?? ""} ${
        !hideViews && !viewsOpen ? styles.gridWorkspaceViewsClosed : ""
      }`}
      style={workspaceStyle}
    >
      {!hideViews && viewsOpen && (
        <button
          type="button"
          className={styles.viewsBackdrop}
          aria-label="Close saved views panel"
          data-testid="super-data-grid-views-backdrop"
          onClick={() => handleViewsOpenChange(false)}
        />
      )}
      {!hideViews && (
        <div
          className={`${styles.viewsSidebarRegion} ${
            viewsOpen ? "" : styles.viewsSidebarRegionClosed
          } tw:z-10 tw:overflow-hidden`}
        >
          <div
            className={styles.viewsSidebarViewport}
            aria-hidden={!viewsOpen}
          >
            <div
              id={viewsSidebarId}
              className={`${styles.viewsSidebarSlot} ${
                viewsOpen ? "" : styles.viewsSidebarSlotClosed
              } tw:flex tw:h-full tw:w-full tw:min-w-0 tw:origin-left tw:transition-all tw:duration-300 tw:ease-out`}
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
                  if (!canEditViews) return;
                  setEditingView(view);
                  handleAddViewOpenChange(true);
                }}
                onDelete={handleDeleteView}
                canAdd={canAddViews}
                canEdit={canEditViews}
                canDelete={canDeleteViews}
              />
            </div>
          </div>
        </div>
      )}
      <div className={styles.gridFrame}>
        <SuperDataGridContext.Provider value={contextValue}>
          <DataGrid
            apiRef={apiRef}
            className={`${styles.gridRoot} tw:font-sans tw:bg-white tw:text-slate-900 tw:[&_.MuiDataGrid-columnHeaders]:border-b tw:[&_.MuiDataGrid-columnHeaders]:border-[#155e75] tw:[&_.MuiDataGrid-columnHeaders]:bg-[#0e7490] tw:[&_.MuiDataGrid-columnHeaders]:text-white tw:[&_.MuiDataGrid-columnHeader]:bg-[#0e7490] tw:[&_.MuiDataGrid-columnHeader]:text-white tw:[&_.MuiDataGrid-columnSeparator]:text-[#155e75] tw:[&_.MuiDataGrid-columnHeaderTitle]:text-sm tw:[&_.MuiDataGrid-columnHeaderTitle]:font-bold tw:[&_.MuiDataGrid-columnHeaderTitle]:uppercase tw:[&_.MuiDataGrid-columnHeaderTitle]:tracking-wider tw:[&_.MuiDataGrid-columnHeaderTitle]:text-white tw:[&_.MuiDataGrid-columnHeader_.MuiDataGrid-sortIcon]:text-cyan-200 tw:[&_.MuiDataGrid-columnHeader_.MuiDataGrid-sortIcon]:h-4 tw:[&_.MuiDataGrid-columnHeader_.MuiDataGrid-sortIcon]:w-4 ${gridClassName ?? ""}`}
            classes={{
              ...(cellClassName ? { cell: cellClassName } : {}),
              ...(columnHeaderClassName ? { columnHeader: columnHeaderClassName } : {}),
              ...(rowClassName ? { row: rowClassName } : {}),
            }}
            disableColumnSorting
            disableVirtualization={isAutoSizing}
            rows={rows}
            columns={dataGridColumns}
            columnGroupingModel={columnGroupingModel}
            columnHeaderHeight={getColumnHeaderHeight(gridColumns)}
            rowHeight={rowHeight}
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
            getRowHeight={getRowHeight}
            getEstimatedRowHeight={getEstimatedRowHeight}
            hideFooter={hideFooter}
            hideFooterSelectedRowCount={hideFooterSelectedRowCount}
            showToolbar={!hideToolbar}
            onDensityChange={handleDensityChange}
            filterModel={filterModel}
            onFilterModelChange={handleFilterModelChange}
            columnVisibilityModel={dataGridColumnVisibilityModel}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            pageSizeOptions={pageSizeOptions}
            rowSelection={checkboxSelection}
            disableRowSelectionExcludeModel={disableRowSelectionExcludeModel}
            disableRowSelectionOnClick
            checkboxSelection={checkboxSelection}
            rowSelectionModel={
              checkboxSelection ? rowSelectionModel : undefined
            }
            onRowSelectionModelChange={handleRowSelectionModelChange}
            keepNonExistentRowsSelected={checkboxSelection}
            isRowSelectable={
              checkboxSelection && isRowSelectable != null
                ? handleGridRowSelectable
                : undefined
            }
            disableColumnMenu
            disableColumnResize
            slots={gridSlots}
            getRowClassName={getRowClassName ?? getDefaultRowClassName}
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
