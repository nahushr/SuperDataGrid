import type { ComponentType } from "react";
import type {
  GridColumnVisibilityModel,
  GridDensity,
  GridRowId,
  GridRowSelectionModel,
  GridSortModel,
  GridValidRowModel,
} from "@mui/x-data-grid";
import type {
  GridFeatureMode,
  GridFilterModel,
  GridPaginationModel,
} from "@mui/x-data-grid";

/** A row passed to SuperDataGrid. */
export type SuperDataGridRow = object;

/** Built-in renderers modeled after SimpliShelf's shared data-grid cells. */
export type SuperDataGridColumnType =
  | "peopleDetails"
  | "address"
  | "audit"
  | "actions";

/** Predefined row actions with matching labels, icons, and colors. */
export const SUPER_DATA_GRID_ACTIONS = {
  VIEW: "view",
  EDIT: "edit",
  DEACTIVATE: "deactivate",
  SHARE: "share",
} as const;

export type SuperDataGridActionType =
  (typeof SUPER_DATA_GRID_ACTIONS)[keyof typeof SUPER_DATA_GRID_ACTIONS];

export type SuperDataGridExportFormat = "xlsx" | "csv" | "json" | "sql";
export type SuperDataGridExportScope = "currentPage" | "allMatching";

/** The minimal input for a SuperDataGrid: field names and object rows. */
export interface SuperDataGridProps<
  Row extends SuperDataGridRow = GridValidRowModel,
> {
  /** Object keys to show as columns, in display order. */
  columns: readonly string[];
  /** Optional built-in renderer for common cells, audit cells, and actions. */
  columnTypes?: Partial<Record<string, SuperDataGridColumnType>>;
  /** Row objects whose keys match the names in `columns`. */
  data: readonly Row[];
  /** Minimum height for the grid workspace. Numbers are pixels; defaults to 800px. */
  minHeight?: number | string;
  /** Controlled row density. Omit to let the grid manage density internally. */
  density?: GridDensity;
  /** Called when the user selects a new row density. */
  onDensityChange?: (density: GridDensity) => void;
  /** Whether filtering is performed by the grid or by the host application. */
  filterMode?: GridFeatureMode;
  /** Whether pagination is performed by the grid or by the host application. */
  paginationMode?: GridFeatureMode;
  /** Total number of rows when `paginationMode` is `server`. */
  rowCount?: number;
  /** Controlled pagination model for server-side or externally managed grids. */
  paginationModel?: GridPaginationModel;
  /** Called when the current page or rows-per-page value changes. */
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  /** Called when the zero-based current page changes. */
  onPageChange?: (page: number) => void;
  /** Called when the rows-per-page value changes. */
  onPageSizeChange?: (pageSize: number) => void;
  /** Controlled filter model for server-side or externally managed grids. */
  filterModel?: GridFilterModel;
  /** Called when the filter model changes. */
  onFilterModelChange?: (model: GridFilterModel) => void;
  /** Whether sorting is performed by the grid or by the host application. */
  sortingMode?: GridFeatureMode;
  /** Controlled sort model for server-side or externally managed grids. */
  sortModel?: GridSortModel;
  /** Called when a column sort or sort direction changes. */
  onSortModelChange?: (model: GridSortModel) => void;
  /**
   * Fetch all rows matching the active filters for a server-side export.
   * Implementations can request data in chunks and should honor `signal`.
   */
  getAllData?: (request: SuperDataGridAllDataRequest) => Promise<readonly Row[]>;
  /** Observe a built-in export request after its format and scope are selected. */
  onExport?: (request: SuperDataGridExportRequest) => void;
  /** Controlled visibility state for columns. */
  columnVisibilityModel?: GridColumnVisibilityModel;
  /** Called when the user changes column visibility. */
  onColumnVisibilityModelChange?: (
    model: GridColumnVisibilityModel,
  ) => void;
  /** Custom React component for rendering a cell in a specific column. */
  cellComponents?: Partial<
    Record<string, ComponentType<SuperDataGridCellProps<Row>>>
  >;
  /** Handle clicks on predefined actions in columns marked with `actions`. */
  onAction?: (request: SuperDataGridActionRequest<Row>) => void;
  /** Saved filter views. Omit to keep views in this grid instance's state. */
  views?: readonly SuperDataGridView[];
  /** Receives updates when a view is added, edited, or removed. */
  onViewsChange?: (views: SuperDataGridView[]) => void;
  /** Called after a saved view is added. */
  onViewAdded?: (view: SuperDataGridView) => void;
  /** Called after a saved view is edited. */
  onViewUpdated?: (view: SuperDataGridView) => void;
  /** Called after a saved view is deleted. */
  onViewDeleted?: (view: SuperDataGridView) => void;
  /** Called when the saved-views sidebar is opened or closed. */
  onViewsOpenChange?: (open: boolean) => void;
  /** Called when the Add/Edit View dialog is opened or closed. */
  onAddViewOpenChange?: (open: boolean) => void;
  /** Called when the filter dialog is opened or closed. */
  onFilterPanelOpenChange?: (open: boolean) => void;
  /** Controlled selected saved view ID; `null` selects all rows. */
  selectedViewId?: string | null;
  /** Called when the selected saved view changes. */
  onSelectedViewChange?: (viewId: string | null) => void;
  /** Show the grid's loading overlay. */
  loading?: boolean;
  /** Show a selection checkbox beside each selectable row. Omit or pass false to hide them. */
  checkboxSelection?: boolean;
  /** Controlled selection model. Omit to let the grid manage selection internally. */
  rowSelectionModel?: GridRowSelectionModel;
  /** Receives changes to the selected row IDs. */
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  /** Return false to disable selection for a row. */
  isRowSelectable?: (params: { row: Row }) => boolean;
  /** Return a stable row ID when rows use a custom ID field. */
  getRowId?: (row: Row) => GridRowId;
  /** Label used in the server-side selection scope dialog (for example, "users"). */
  selectionLabel?: string;
  /** Fetch every row matching the current filters for server-side Select all. */
  getAllRows?: (
    request: SuperDataGridAllRowsRequest,
  ) => Promise<readonly Row[]>;
  /** Whether soft-deleted rows should be included in host-side data requests. */
  includeDeleted?: boolean;
  /** Called when the Include Deleted checkbox changes. */
  onIncludeDeletedChange?: (includeDeleted: boolean) => void;
  /** Hide the Include Deleted checkbox. */
  hideIncludeDeleted?: boolean;
  /** Called immediately when the user clicks the Bulk delete button. */
  onBulkDelete?: (
    request: SuperDataGridBulkDeleteRequest<Row>,
  ) => void | Promise<void>;
  /** Hide the Bulk delete button, even when `onBulkDelete` is provided. */
  hideBulkDelete?: boolean;
}

/** Context supplied to a host-side bulk delete operation. */
export interface SuperDataGridBulkDeleteRequest<
  Row extends SuperDataGridRow = GridValidRowModel,
> {
  /** MUI selection model; an `exclude` model means all matching rows except these IDs. */
  rowSelectionModel: GridRowSelectionModel;
  /** Active filters, which define the scope of an `exclude` selection. */
  filterModel: GridFilterModel;
  /** Current page and page size at the time deletion was confirmed. */
  paginationModel: GridPaginationModel;
  /** Current Include Deleted state. */
  includeDeleted: boolean;
  /** Number of selected rows represented by the grid's current selection model. */
  selectedCount: number;
  /** Selected rows currently loaded into the grid; server mode may contain only one page. */
  loadedSelectedRows: readonly Row[];
}

export interface SuperDataGridCellProps<Row extends SuperDataGridRow = object> {
  field: string;
  value: unknown;
  row: Row;
}

/** Context passed to the handler for a predefined action button. */
export interface SuperDataGridActionRequest<
  Row extends SuperDataGridRow = GridValidRowModel,
> {
  action: SuperDataGridActionType;
  field: string;
  row: Row;
}

/** Details for an export started from the grid toolbar. */
export interface SuperDataGridExportRequest {
  format: SuperDataGridExportFormat;
  scope: SuperDataGridExportScope;
  columns: readonly string[];
  filterModel: GridFilterModel;
  paginationModel: GridPaginationModel;
  includeDeleted: boolean;
}

export interface SuperDataGridAllDataRequest {
  columns: readonly string[];
  filterModel: GridFilterModel;
  paginationModel: GridPaginationModel;
  includeDeleted: boolean;
  signal: AbortSignal;
}

export interface SuperDataGridAllRowsRequest {
  filterModel: GridFilterModel;
  paginationModel: GridPaginationModel;
  includeDeleted: boolean;
  signal: AbortSignal;
}

export interface SuperDataGridView {
  id: string;
  name: string;
  notes?: string;
  filterModel: GridFilterModel;
}

export type SuperDataGridAllDataFetcher = (
  request: SuperDataGridAllDataRequest,
) => Promise<readonly SuperDataGridRow[]>;

export type SuperDataGridCellComponent<Row extends SuperDataGridRow = object> =
  ComponentType<SuperDataGridCellProps<Row>>;
