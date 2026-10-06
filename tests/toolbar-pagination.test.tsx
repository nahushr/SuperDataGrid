import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toolbarContainer: vi.fn(),
  apiRef: {
    current: {
      setPage: vi.fn(),
      setPageSize: vi.fn(),
      subscribeEvent: vi.fn(() => vi.fn()),
    },
  },
  paginationModel: { page: 0, pageSize: 25 },
  pageCount: 4,
  rowCount: 86,
  filteredIds: [1, 2],
  currentPageIds: [2],
}));

vi.mock("@mui/x-data-grid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/x-data-grid")>();
  return {
    ...actual,
    GridToolbarContainer: mocks.toolbarContainer,
    useGridApiContext: () => mocks.apiRef,
    useGridSelector: (_api: unknown, selector: unknown) => {
      if (selector === actual.gridPaginationModelSelector) return mocks.paginationModel;
      if (selector === actual.gridPageCountSelector) return mocks.pageCount;
      if (selector === actual.gridPaginationRowCountSelector) return mocks.rowCount;
      if (selector === actual.gridFilteredSortedRowIdsSelector) return mocks.filteredIds;
      if (selector === actual.gridPaginatedVisibleSortedGridRowIdsSelector) return mocks.currentPageIds;
      return undefined;
    },
  };
});

import SuperDataGridPagination from "../src/components/SuperDataGridPagination";
import SuperDataGridToolbar from "../src/components/SuperDataGridToolbar";
import { SuperDataGridContext, type SuperDataGridContextValue } from "../src/context/SuperDataGridContext";

const baseContext = (): SuperDataGridContextValue => ({
  columns: [
    { field: "name", headerName: "Name" },
    { field: "email", headerName: "Email" },
    { field: "internal", headerName: "Internal", hideable: false },
  ],
  beforeTable: <p>Grid instructions</p>,
  rows: [{ id: 1, name: "Ada", email: "ada@example.com" }, { id: 2, name: "Lin", email: "lin@example.com" }],
  density: "standard",
  onDensityChange: vi.fn(),
  filterModel: { items: [] },
  filterMode: "client",
  paginationMode: "client",
  paginationModel: { page: 0, pageSize: 25 },
  pageSizeOptions: [10, 25, 50],
  views: [],
  selectedViewId: null,
  viewsOpen: true,
  hideViews: false,
  checkboxSelection: true,
  includeDeleted: false,
  selectionLabel: "users",
  showIncludeDeleted: true,
  onIncludeDeletedChange: vi.fn(),
  selectionCount: 2,
  bulkDeleteLabel: "Bulk delete",
  canBulkDelete: true,
  onBulkDelete: vi.fn(async () => undefined),
  onHeaderSelectionIntent: vi.fn(),
  onClearSelection: vi.fn(),
  columnVisibilityModel: { email: false },
  onColumnVisibilityModelChange: vi.fn(),
  onFilterClick: vi.fn(),
  onToggleViews: vi.fn(),
});

function provideContext(context: SuperDataGridContextValue, children: React.ReactNode) {
  return render(<SuperDataGridContext.Provider value={context}>{children}</SuperDataGridContext.Provider>);
}

beforeEach(() => {
  mocks.toolbarContainer.mockImplementation(({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => React.createElement("div", props, children));
  mocks.paginationModel = { page: 0, pageSize: 25 };
  mocks.pageCount = 4;
  mocks.rowCount = 86;
  mocks.filteredIds = [1, 2];
  mocks.currentPageIds = [2];
  mocks.apiRef.current.setPage.mockClear();
  mocks.apiRef.current.setPageSize.mockClear();
  mocks.apiRef.current.subscribeEvent.mockClear();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:test-export"),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});

describe("grid toolbar", () => {
  it("renders shared controls and reports toolbar, column, density, deletion, and deleted-row actions", async () => {
    const context = baseContext();
    const { container, unmount } = render(<SuperDataGridToolbar />);
    expect(container.firstChild).toBeNull();
    unmount();

    const gridView = provideContext(context, <SuperDataGridToolbar />);
    expect(screen.getByText("Grid instructions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show or hide saved views" }));
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear 2 selected rows" }));
    expect(context.onToggleViews).toHaveBeenCalledOnce();
    expect(context.onFilterClick).toHaveBeenCalledOnce();
    expect(context.onClearSelection).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Show or hide columns" }));
    expect(screen.getByRole("checkbox", { name: "Name" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Email" })).not.toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Internal" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(context.onColumnVisibilityModelChange).toHaveBeenCalledWith({});
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Adjust row density" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Compact" }));
    expect(context.onDensityChange).toHaveBeenCalledWith("compact");

    fireEvent.click(screen.getByRole("checkbox", { name: "Include Deleted" }));
    expect(context.onIncludeDeletedChange).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: /Bulk delete/ }));
    await waitFor(() => expect(context.onBulkDelete).toHaveBeenCalledOnce());

    const hiddenContext = { ...context, hideViews: true, checkboxSelection: false, showIncludeDeleted: false, canBulkDelete: false, beforeTable: null };
    gridView.rerender(<SuperDataGridContext.Provider value={hiddenContext}><SuperDataGridToolbar /></SuperDataGridContext.Provider>);
    expect(screen.queryByRole("button", { name: "Show or hide saved views" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Include Deleted" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bulk delete/ })).not.toBeInTheDocument();
  });

  it("exports the current page or all server rows, and shows recoverable errors", async () => {
    const onExport = vi.fn();
    const getAllData = vi.fn(async () => [
      { id: 1, name: "Ada", email: "ada@example.com" },
      { id: 2, name: "Lin", email: "lin@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
    ]);
    const context = {
      ...baseContext(),
      filterMode: "server" as const,
      paginationMode: "server" as const,
      getAllData,
      onExport,
      includeDeleted: true,
    };
    const currentExportView = provideContext(context, <SuperDataGridToolbar />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "CSV (.csv)" }));
    await screen.findByRole("heading", { name: "Export CSV (.csv)" });
    fireEvent.click(screen.getByRole("button", { name: /Current table view/ }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith(expect.objectContaining({ format: "csv", scope: "currentPage", includeDeleted: true })));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "JSON (.json)" }));
    await screen.findByRole("heading", { name: "Export JSON (.json)" });
    fireEvent.click(screen.getByRole("button", { name: /All matching data/ }));
    await waitFor(() => expect(getAllData).toHaveBeenCalledWith(expect.objectContaining({ columns: ["name", "internal"], includeDeleted: true, signal: expect.any(AbortSignal) })));
    await waitFor(() => expect(onExport).toHaveBeenLastCalledWith(expect.objectContaining({ format: "json", scope: "allMatching" })));
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled());

    currentExportView.unmount();
    const failing = { ...context, getAllData: vi.fn(async () => { throw new Error("could not fetch export rows"); }) };
    const { rerender } = render(<SuperDataGridContext.Provider value={failing}><SuperDataGridToolbar /></SuperDataGridContext.Provider>);
    fireEvent.click(screen.getAllByRole("button", { name: "Export" })[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "JSON (.json)" }));
    await screen.findByRole("heading", { name: "Export JSON (.json)" });
    fireEvent.click(screen.getByRole("button", { name: /All matching data/ }));
    expect(await screen.findByText("could not fetch export rows")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    rerender(<SuperDataGridContext.Provider value={{ ...failing, filterMode: "client", paginationMode: "client", getAllData: undefined }}><SuperDataGridToolbar /></SuperDataGridContext.Provider>);
    expect(screen.getByRole("button", { name: "Export" })).toBeEnabled();
  });

  it("aborts all-pages export when the page unloads and reports delete errors", async () => {
    let exportSignal: AbortSignal | undefined;
    const getAllData = vi.fn(({ signal }: { signal: AbortSignal }) => {
      exportSignal = signal;
      return new Promise<Array<Record<string, unknown>>>(() => undefined);
    });
    const onBulkDelete = vi.fn(async () => { throw new Error("delete failed"); });
    const context = { ...baseContext(), filterMode: "server" as const, getAllData, onBulkDelete };
    provideContext(context, <SuperDataGridToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "JSON (.json)" }));
    await screen.findByRole("heading", { name: "Export JSON (.json)" });
    fireEvent.click(screen.getByRole("button", { name: /All matching data/ }));
    await waitFor(() => expect(getAllData).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent(window, new Event("pagehide"));
    expect(exportSignal?.aborted).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Bulk delete/ }));
    expect(await screen.findByText("delete failed")).toBeInTheDocument();
  });
});

describe("grid pagination", () => {
  it("shows current range, changes rows per page, and navigates rounded page buttons", () => {
    const context = { ...baseContext(), pageSizeOptions: [10, 25, 50] };
    provideContext(context, <SuperDataGridPagination />);
    expect(screen.getByText("1–25 of 86")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Grid pages" })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Rows per page" }));
    fireEvent.click(screen.getByRole("option", { name: "50" }));
    expect(mocks.apiRef.current.setPageSize).toHaveBeenCalledWith(50);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(mocks.apiRef.current.setPage).toHaveBeenCalledWith(1);
  });

  it("uses default page-size options and renders an empty range with disabled navigation", () => {
    mocks.rowCount = 0;
    mocks.pageCount = 0;
    const context = { ...baseContext(), pageSizeOptions: [] };
    provideContext(context, <SuperDataGridPagination />);
    expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeDisabled();
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Rows per page" }));
    expect(screen.getByRole("option", { name: "500" })).toBeInTheDocument();
  });
});
