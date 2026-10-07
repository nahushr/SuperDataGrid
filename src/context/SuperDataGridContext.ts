import { createContext, type ReactNode } from "react";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridDensity,
  GridFilterModel,
  GridPaginationModel,
  GridValidRowModel,
} from "@mui/x-data-grid";
import type {
  SuperDataGridExportRequest,
  SuperDataGridAllDataFetcher,
  SuperDataGridView,
} from "../types";

export interface SuperDataGridContextValue {
  columns: GridColDef[];
  beforeTable?: ReactNode;
  toolbarActions?: ReactNode;
  rows: GridValidRowModel[];
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
  filterModel: GridFilterModel;
  filterMode: "client" | "server";
  paginationMode: "client" | "server";
  paginationModel: GridPaginationModel;
  pageSizeOptions: number[];
  getAllData?: SuperDataGridAllDataFetcher;
  onExport?: (request: SuperDataGridExportRequest) => void;
  views: readonly SuperDataGridView[];
  selectedViewId: string | null;
  viewsOpen: boolean;
  hideViews: boolean;
  checkboxSelection: boolean;
  includeDeleted: boolean;
  selectionLabel: string;
  showIncludeDeleted: boolean;
  onIncludeDeletedChange?: (includeDeleted: boolean) => void;
  selectionCount: number;
  bulkDeleteLabel: string;
  canBulkDelete: boolean;
  onBulkDelete: () => Promise<void>;
  onHeaderSelectionIntent: (selecting: boolean) => void;
  onClearSelection: () => void;
  columnVisibilityModel: GridColumnVisibilityModel;
  onColumnVisibilityModelChange: (
    model: GridColumnVisibilityModel,
  ) => void;
  onFilterClick: () => void;
  onToggleViews: () => void;
}

export const SuperDataGridContext =
  createContext<SuperDataGridContextValue | null>(null);
