import React, { createElement, useContext } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GridColDef, GridFilterModel, GridRowSelectionModel } from "@mui/x-data-grid";

const mocks = vi.hoisted(() => ({ DataGrid: vi.fn() }));

vi.mock("@mui/x-data-grid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/x-data-grid")>();
  return { ...actual, DataGrid: mocks.DataGrid };
});

import SuperDataGrid from "../src/SuperDataGrid";
import { SuperDataGridContext } from "../src/context/SuperDataGridContext";

interface MockGridProps {
  columns: GridColDef[];
  rows: Array<Record<string, unknown> & { id: string | number }>;
  loading?: boolean;
  hideFooter?: boolean;
  onSortModelChange?: (model: unknown) => void;
  onPaginationModelChange?: (model: unknown) => void;
  onFilterModelChange?: (model: GridFilterModel) => void;
  onDensityChange?: (density: string) => void;
  onColumnVisibilityModelChange?: (model: Record<string, boolean>) => void;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  slots?: Record<string, React.ComponentType | undefined>;
  columnVisibilityModel?: Record<string, boolean>;
}

let lastGridProps: MockGridProps | undefined;

function TestGrid(props: MockGridProps) {
  lastGridProps = props;
  const context = useContext(SuperDataGridContext);
  const visibleColumns = props.columns.filter(
    (column) => props.columnVisibilityModel?.[column.field] !== false && !column.field.includes("."),
  );
  const renderValue = (column: GridColDef, row: MockGridProps["rows"][number]) => {
    const value = column.valueGetter
      ? (column.valueGetter as (value: unknown, row: unknown) => unknown)(row[column.field], row)
      : row[column.field];
    return column.renderCell
      ? column.renderCell({
          id: row.id,
          field: column.field,
          row,
          value,
          formattedValue: value,
          hasFocus: false,
          tabIndex: 0,
        } as never)
      : String(value ?? "");
  };
  const Overlay = props.loading ? props.slots?.loadingOverlay : props.rows.length === 0 ? props.slots?.noRowsOverlay : undefined;

  return (
    <section data-testid="mock-data-grid">
      {context?.beforeTable}
      <div data-testid="headers">{visibleColumns.map((column) => <span key={column.field}>{column.headerName}</span>)}</div>
      {props.rows.map((row) => (
        <div data-testid={`row-${row.id}`} key={String(row.id)}>
          {visibleColumns.map((column) => <div key={column.field}>{renderValue(column, row)}</div>)}
        </div>
      ))}
      {Overlay && createElement(Overlay)}
      <button onClick={() => props.onSortModelChange?.([{ field: "name", sort: "asc" }])}>Trigger sort</button>
      <button onClick={() => props.onPaginationModelChange?.({ page: 2, pageSize: 50 })}>Trigger pagination</button>
      <button onClick={() => props.onFilterModelChange?.({ items: [{ field: "name", operator: "contains", value: "Ada" }] })}>Trigger filter</button>
      <button onClick={() => props.onDensityChange?.("compact")}>Trigger density</button>
      <button onClick={() => props.onColumnVisibilityModelChange?.({ name: false, "person.email": false })}>Trigger columns</button>
      <button onClick={() => props.onRowSelectionModelChange?.({ type: "include", ids: new Set([props.rows[0]?.id]) })}>Select row</button>
      <button onClick={() => context?.onFilterClick()}>Open filters</button>
      <button onClick={() => context?.onToggleViews()}>Toggle views</button>
      <button onClick={() => context?.onHeaderSelectionIntent(true)}>Select all matching</button>
      <button onClick={() => void context?.onBulkDelete()}>Delete selected</button>
      <button onClick={() => context?.onClearSelection()}>Clear selection</button>
      <button onClick={() => context?.onIncludeDeletedChange?.(!context.includeDeleted)}>Toggle deleted</button>
    </section>
  );
}

beforeEach(() => {
  lastGridProps = undefined;
  mocks.DataGrid.mockImplementation(TestGrid);
});

describe("SuperDataGrid integration", () => {
  it("builds grid columns, typed cells, row ids, and sends grid state callbacks", () => {
    const onDensityChange = vi.fn();
    const onSortModelChange = vi.fn();
    const onPaginationModelChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const onFilterModelChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    const onColumnVisibilityModelChange = vi.fn();
    const onRowSelectionModelChange = vi.fn();
    const onIncludeDeletedChange = vi.fn();
    const onAction = vi.fn();
    const CustomCell = ({ value }: { value: unknown }) => <strong>Custom {String(value)}</strong>;
    const data = [
      { id: 0, name: "Ada", active: true, createdAt: "2026-01-02", amount: 1234.5, meta: { email: "ada@example.com" }, action: ["view"] },
      { _id: "legacy", name: "Lin", active: false, createdAt: "bad date", amount: null, meta: { email: "lin@example.com" }, action: [] },
      { name: "Fallback id", active: true, createdAt: null, amount: 0, meta: {}, action: [] },
    ];
    render(<SuperDataGrid
      columns={["name", "active", "createdAt", "amount", "meta", "action", "custom"]}
      data={data}
      minHeight="520px"
      beforeTable={<strong>Before grid</strong>}
      columnTypes={{ amount: "currency", action: "actions" }}
      cellComponents={{ custom: CustomCell }}
      checkboxSelection
      onAction={onAction}
      onDensityChange={onDensityChange}
      onSortModelChange={onSortModelChange}
      onPaginationModelChange={onPaginationModelChange}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onFilterModelChange={onFilterModelChange}
      onSelectedViewChange={onSelectedViewChange}
      onColumnVisibilityModelChange={onColumnVisibilityModelChange}
      onRowSelectionModelChange={onRowSelectionModelChange}
      onIncludeDeletedChange={onIncludeDeletedChange}
    />);

    expect(screen.getByText("Before grid")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
    expect(screen.getAllByText("Custom undefined")).toHaveLength(3);
    expect(screen.getByTestId("row-0")).toBeInTheDocument();
    expect(screen.getByTestId("row-legacy")).toBeInTheDocument();
    expect(screen.getByTestId("row-super-data-grid-row-2")).toBeInTheDocument();
    expect(document.querySelector(".gridWorkspace") ?? document.querySelector("[class*=gridWorkspace]")).toHaveStyle({ "--super-data-grid-min-height": "520px" });
    expect(lastGridProps?.columns.some((column) => column.field === "meta.email")).toBe(true);
    expect(lastGridProps?.columnVisibilityModel?.["meta.email"]).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Trigger sort" }));
    fireEvent.click(screen.getByRole("button", { name: "Trigger pagination" }));
    fireEvent.click(screen.getByRole("button", { name: "Trigger filter" }));
    fireEvent.click(screen.getByRole("button", { name: "Trigger density" }));
    fireEvent.click(screen.getByRole("button", { name: "Trigger columns" }));
    fireEvent.click(screen.getByRole("button", { name: "Select row" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle deleted" }));
    expect(onSortModelChange).toHaveBeenCalledWith([{ field: "name", sort: "asc" }]);
    expect(onPaginationModelChange).toHaveBeenCalledWith({ page: 2, pageSize: 50 });
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(onFilterModelChange).toHaveBeenCalledWith(expect.objectContaining({ items: [expect.objectContaining({ field: "name" })] }));
    expect(onSelectedViewChange).toHaveBeenCalledWith(null);
    expect(onDensityChange).toHaveBeenCalledWith("compact");
    expect(onColumnVisibilityModelChange).toHaveBeenCalledWith({ name: false });
    expect(onRowSelectionModelChange).toHaveBeenCalledWith({ type: "include", ids: new Set([0]) });
    expect(onIncludeDeletedChange).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ action: "view", field: "action", row: expect.objectContaining({ id: 0 }) }));
  });

  it("applies and preserves filters, and independently adds, edits, selects, and deletes views", async () => {
    const onFilterModelChange = vi.fn();
    const onViewsChange = vi.fn();
    const onViewAdded = vi.fn();
    const onViewUpdated = vi.fn();
    const onViewDeleted = vi.fn();
    const onViewsOpenChange = vi.fn();
    const onAddViewOpenChange = vi.fn();
    const onFilterPanelOpenChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    render(<SuperDataGrid
      columns={["name", "age"]}
      data={[{ id: 1, name: "Ada", age: 37 }]}
      columnTypes={{ age: undefined }}
      onFilterModelChange={onFilterModelChange}
      onViewsChange={onViewsChange}
      onViewAdded={onViewAdded}
      onViewUpdated={onViewUpdated}
      onViewDeleted={onViewDeleted}
      onViewsOpenChange={onViewsOpenChange}
      onAddViewOpenChange={onAddViewOpenChange}
      onFilterPanelOpenChange={onFilterPanelOpenChange}
      onSelectedViewChange={onSelectedViewChange}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Open filters" }));
    expect(screen.getByText("Filter Data")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove All" }));
    fireEvent.click(screen.getByRole("button", { name: "Close filter dialog" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onFilterPanelOpenChange).toHaveBeenCalledWith(true);
    expect(onFilterPanelOpenChange).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "Add view" }));
    expect(onAddViewOpenChange).toHaveBeenCalledWith(true);
    fireEvent.change(screen.getByRole("textbox", { name: "View name" }), { target: { value: " Staff " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Notes (optional)" }), { target: { value: " Internal " } });
    fireEvent.click(screen.getByRole("button", { name: "Save view" }));
    await waitFor(() => expect(onViewAdded).toHaveBeenCalledWith(expect.objectContaining({ name: "Staff", notes: "Internal" })));
    expect(onViewsChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: "Staff" })]));
    expect(onSelectedViewChange).toHaveBeenCalledWith(expect.stringMatching(/^view-/));
    expect(onAddViewOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    const created = onViewAdded.mock.calls[0][0];
    fireEvent.click(screen.getByRole("button", { name: /^Staff/ }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Staff" }));
    expect(screen.getByRole("heading", { name: "Edit view" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "View name" }), { target: { value: " Staff Plus " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onViewUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: created.id, name: "Staff Plus" })));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete Staff Plus" }));
    expect(onViewDeleted).toHaveBeenCalledWith(expect.objectContaining({ id: created.id, name: "Staff Plus" }));
    expect(onViewsOpenChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Toggle views" }));
    expect(onViewsOpenChange).toHaveBeenCalledWith(false);
  });

  it("selects selectable rows across server pages and aborts an in-flight select on pagehide", async () => {
    const getAllRows = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
      return [{ id: 1 }, { id: 2 }, { id: 3 }];
    });
    const onRowSelectionModelChange = vi.fn();
    const onIncludeDeletedChange = vi.fn();
    render(<SuperDataGrid
      columns={["name"]}
      data={[{ id: 1, name: "Ada" }, { id: 2, name: "Lin" }]}
      checkboxSelection
      filterMode="server"
      paginationMode="server"
      rowCount={5}
      isRowSelectable={({ row }) => row.id !== 2}
      getAllRows={getAllRows}
      includeDeleted
      onIncludeDeletedChange={onIncludeDeletedChange}
      onRowSelectionModelChange={onRowSelectionModelChange}
    />);
    fireEvent.click(screen.getByRole("button", { name: "Select all matching" }));
    expect(screen.getByText(/all 5 matching rows/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Current page" }));
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith({ type: "include", ids: new Set([1]) });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Select all matching" }));
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    await waitFor(() => expect(getAllRows).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: true, filterModel: expect.any(Object), paginationModel: expect.any(Object), signal: expect.any(AbortSignal) })));
    fireEvent(window, new Event("pagehide"));
    await waitFor(() => expect(getAllRows.mock.calls[0][0].signal.aborted).toBe(true));
  });

  it("handles select-all success and errors, bulk-delete payloads, clearing selection, and controlled props", async () => {
    const getAllRows = vi.fn(async () => [{ id: 1 }, { id: 2 }]);
    const onRowSelectionModelChange = vi.fn();
    const onBulkDelete = vi.fn(async () => undefined);
    const onPaginationModelChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { rerender } = render(<SuperDataGrid
      columns={["name"]}
      data={[{ id: 1, name: "Ada" }, { id: 2, name: "Lin" }]}
      checkboxSelection
      filterMode="server"
      paginationMode="server"
      rowCount={4}
      getAllRows={getAllRows}
      isRowSelectable={({ row }) => row.id !== 2}
      rowSelectionModel={{ type: "include", ids: new Set([1]) }}
      onRowSelectionModelChange={onRowSelectionModelChange}
      onBulkDelete={onBulkDelete}
    />);
    fireEvent.click(screen.getByRole("button", { name: "Select all matching" }));
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    await waitFor(() => expect(onRowSelectionModelChange).toHaveBeenLastCalledWith({ type: "include", ids: new Set([1]) }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    await waitFor(() => expect(onBulkDelete).toHaveBeenCalledWith(expect.objectContaining({
      selectedCount: 1,
      loadedSelectedRows: [expect.objectContaining({ id: 1 })],
      rowSelectionModel: { type: "include", ids: new Set([1]) },
    })));
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith({ type: "include", ids: new Set() });

    const failingFetch = vi.fn(async () => { throw new Error("server unavailable"); });
    rerender(<SuperDataGrid columns={["name"]} data={[{ id: 1, name: "Ada" }]} checkboxSelection filterMode="server" paginationMode="server" rowCount={4} getAllRows={failingFetch} />);
    fireEvent.click(screen.getByRole("button", { name: "Select all matching" }));
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(await screen.findByText("server unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    const controlledProps = {
      paginationModel: { page: 1, pageSize: 10 },
      onPaginationModelChange,
      onPageChange,
      onPageSizeChange,
      sortModel: [{ field: "name", sort: "desc" as const }],
      onSortModelChange: vi.fn(),
      columnVisibilityModel: { name: false },
      onColumnVisibilityModelChange: vi.fn(),
    };
    rerender(<SuperDataGrid columns={["name"]} data={[{ id: 1, name: "Ada" }]} {...controlledProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Trigger pagination" }));
    expect(onPaginationModelChange).toHaveBeenCalledWith({ page: 2, pageSize: 50 });
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(lastGridProps?.sortModel).toEqual([{ field: "name", sort: "desc" }]);
    expect(lastGridProps?.columnVisibilityModel?.name).toBe(false);
  });

  it("uses fallback row ids, custom overlays, and selection without server scope", () => {
    const CustomOverlay = () => <div>Custom overlay</div>;
    render(<SuperDataGrid
      columns={["value"]}
      data={[]}
      hideToolbar
      hideViews
      loading
      dataGridSlots={{ loadingOverlay: CustomOverlay, noRowsOverlay: CustomOverlay }}
    />);
    expect(screen.getByText("Custom overlay")).toBeInTheDocument();
    expect(lastGridProps?.hideFooter).toBe(false);
    expect(lastGridProps?.rowSelection).toBe(false);
  });
});
