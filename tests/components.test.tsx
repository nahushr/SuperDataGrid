import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SuperDataGridAddViewDialog from "../src/components/SuperDataGridAddViewDialog";
import SuperDataGridBulkDeleteDialog from "../src/components/SuperDataGridBulkDeleteDialog";
import SuperDataGridExportScopeDialog from "../src/components/SuperDataGridExportScopeDialog";
import SuperDataGridFilterPanel from "../src/components/SuperDataGridFilterPanel";
import SuperDataGridLoadingOverlay from "../src/components/SuperDataGridLoadingOverlay";
import SuperDataGridNoRowsOverlay from "../src/components/SuperDataGridNoRowsOverlay";
import SuperDataGridSelectionScopeDialog from "../src/components/SuperDataGridSelectionScopeDialog";
import SuperDataGridViewFilterBuilder from "../src/components/SuperDataGridViewFilterBuilder";
import SuperDataGridViewsSidebar from "../src/components/SuperDataGridViewsSidebar";
import { SuperDataGridContext, type SuperDataGridContextValue } from "../src/context/SuperDataGridContext";

const GridLogicOperator = { And: "and", Or: "or" } as const;

const fields = [
  { field: "name", headerName: "Name", type: "string" as const },
  { field: "age", headerName: "Age", type: "number" as const },
  { field: "active", headerName: "Active", type: "boolean" as const },
  { field: "joined", headerName: "Joined", type: "date" as const },
  { field: "hidden", headerName: "Hidden", filterable: false },
];

const emptyGridContext: SuperDataGridContextValue = {
  columns: [], beforeTable: null, rows: [], density: "standard", onDensityChange: vi.fn(),
  filterModel: { items: [] }, filterMode: "client", paginationMode: "client",
  paginationModel: { page: 0, pageSize: 25 }, pageSizeOptions: [10, 25],
  views: [], selectedViewId: null, viewsOpen: true, hideViews: false,
  checkboxSelection: false, includeDeleted: false, selectionLabel: "rows",
  showIncludeDeleted: false, selectionCount: 0, bulkDeleteLabel: "Delete",
  canBulkDelete: false, onBulkDelete: vi.fn(async () => undefined),
  onHeaderSelectionIntent: vi.fn(), onClearSelection: vi.fn(),
  columnVisibilityModel: {}, onColumnVisibilityModelChange: vi.fn(),
  onFilterClick: vi.fn(), onToggleViews: vi.fn(),
};

describe("loading and empty-state overlays", () => {
  it("announces the animated loading state accessibly", () => {
    render(<SuperDataGridLoadingOverlay className="custom-overlay" />);
    expect(screen.getByRole("status", { name: "Fetching details" })).toHaveClass("custom-overlay");
    expect(screen.getByText("Loading this page of records")).toBeInTheDocument();
  });

  it("distinguishes an empty grid from filters with no matches", () => {
    const { rerender } = render(
      <SuperDataGridContext.Provider value={emptyGridContext}>
        <SuperDataGridNoRowsOverlay />
      </SuperDataGridContext.Provider>,
    );
    expect(screen.getByText("No rows to display")).toBeInTheDocument();
    rerender(
      <SuperDataGridContext.Provider value={{ ...emptyGridContext, filterModel: { items: [{ field: "name", operator: "contains", value: "x" }] } }}>
        <SuperDataGridNoRowsOverlay />
      </SuperDataGridContext.Provider>,
    );
    expect(screen.getByText("No rows match these filters")).toBeInTheDocument();
    expect(screen.getByText(/Adjust or clear/)).toBeInTheDocument();
  });
});

describe("scope and delete dialogs", () => {
  it("offers the current or all-data export scopes and communicates when all-data is disabled", () => {
    const onCurrentView = vi.fn();
    const onAllData = vi.fn();
    const { rerender } = render(<SuperDataGridExportScopeDialog open formatLabel="CSV" canExportAllData={false} onClose={vi.fn()} onCurrentView={onCurrentView} onAllData={onAllData} />);
    expect(screen.getByText("Add a getAllData callback to enable all-pages export.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All matching data/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Current table view/ }));
    expect(onCurrentView).toHaveBeenCalledOnce();
    rerender(<SuperDataGridExportScopeDialog open formatLabel="CSV" canExportAllData onClose={vi.fn()} onCurrentView={onCurrentView} onAllData={onAllData} />);
    fireEvent.click(screen.getByRole("button", { name: /All matching data/ }));
    expect(onAllData).toHaveBeenCalledOnce();
  });

  it("offers current-page and all-row selection, reports errors, and shows loading", () => {
    const onClose = vi.fn();
    const onSelectCurrentPage = vi.fn();
    const onSelectAll = vi.fn();
    const { rerender } = render(<SuperDataGridSelectionScopeDialog open itemLabel="users" currentPageCount={25} totalCount={86} canSelectAll={false} selectingAll={false} error="Selection failed" onClose={onClose} onSelectCurrentPage={onSelectCurrentPage} onSelectAll={onSelectAll} />);
    expect(screen.getByText(/25 users on the current page or all 86 matching users/)).toBeInTheDocument();
    expect(screen.getByText("Selection failed")).toBeInTheDocument();
    expect(screen.getByText("Provide a getAllRows callback to select all matching rows.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select all" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Current page" }));
    expect(onSelectCurrentPage).toHaveBeenCalledOnce();
    rerender(<SuperDataGridSelectionScopeDialog open itemLabel="users" currentPageCount={25} totalCount={86} canSelectAll selectingAll error={null} onClose={onClose} onSelectCurrentPage={onSelectCurrentPage} onSelectAll={onSelectAll} />);
    expect(screen.getByRole("button", { name: "Selecting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Current page" })).toBeDisabled();
  });

  it("renders delete errors and disables dialog actions while deleting", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(<SuperDataGridBulkDeleteDialog open itemLabel="users" selectedCount={3} loading={false} error="Delete failed" onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByText("Delete selected users?")).toBeInTheDocument();
    expect(screen.getByText("Delete failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    rerender(<SuperDataGridBulkDeleteDialog open itemLabel="users" selectedCount={3} loading error={null} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});

describe("saved view filters and sidebar", () => {
  it("maps numeric, boolean, list, and date conditions into a filter model", async () => {
    const onChange = vi.fn();
    render(<SuperDataGridViewFilterBuilder columns={fields} initialModel={{
      logicOperator: GridLogicOperator.Or,
      items: [
        { id: 1, field: "age", operator: ">", value: "18" },
        { id: 2, field: "active", operator: "is", value: "true" },
        { id: 3, field: "name", operator: "isAnyOf", value: ["Ada", "Lin"] },
        { id: 4, field: "joined", operator: "after", value: new Date("2026-01-01T00:00:00Z") },
        { id: 5, field: "age", operator: "isEmpty" },
      ],
    }} onChange={onChange} />);
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ logicOperator: GridLogicOperator.Or, items: expect.arrayContaining([
      expect.objectContaining({ field: "age", value: 18 }),
      expect.objectContaining({ field: "active", value: true }),
      expect.objectContaining({ field: "name", value: ["Ada", "Lin"] }),
      expect.objectContaining({ field: "joined", value: expect.any(Date) }),
      expect.objectContaining({ field: "age", operator: "isEmpty", value: "" }),
    ]) })));
    expect(screen.getAllByRole("combobox")).toHaveLength(11);
    expect(screen.queryByRole("option", { name: "Hidden" })).not.toBeInTheDocument();
  });

  it("adds, removes, switches match logic, and saves independent view filters", async () => {
    const onChange = vi.fn();
    render(<SuperDataGridViewFilterBuilder columns={fields} initialModel={{ items: [] }} onChange={onChange} />);
    expect(screen.getByText(/currently has no filters/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove condition 1" }));
    expect(screen.getByText(/currently has no filters/)).toBeInTheDocument();

    const savedView = {
      id: "admins", name: "Admins", notes: "Admins only",
      filterModel: { items: [{ id: 1, field: "age", operator: ">", value: 18 }] },
    };
    const callbacks = { onAdd: vi.fn(), onSelect: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
    const view = render(<SuperDataGridViewsSidebar views={[savedView]} selectedViewId="admins" {...callbacks} />);
    expect(screen.queryByText("Admins only")).not.toBeInTheDocument();
    expect(screen.queryByText("1 condition")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /All data/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Admins/ }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Admins" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Admins" }));
    fireEvent.click(screen.getByRole("button", { name: "Add view" }));
    expect(callbacks.onSelect).toHaveBeenNthCalledWith(1, null);
    expect(callbacks.onSelect).toHaveBeenNthCalledWith(2, savedView);
    expect(callbacks.onEdit).toHaveBeenCalledWith(savedView);
    expect(callbacks.onDelete).toHaveBeenCalledWith(savedView);
    expect(callbacks.onAdd).toHaveBeenCalledOnce();
    view.rerender(<SuperDataGridViewsSidebar views={[]} selectedViewId={null} canAdd={false} onAdd={callbacks.onAdd} onSelect={callbacks.onSelect} onEdit={callbacks.onEdit} onDelete={callbacks.onDelete} />);
    expect(screen.getByText(/Add a view to save/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add view" })).not.toBeInTheDocument();
  });

  it("creates and edits saved views in the modal with trimmed text", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(<SuperDataGridAddViewDialog open columns={fields} initialView={null} onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByRole("textbox", { name: "View name" }), { target: { value: "  Active users  " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Notes (optional)" }), { target: { value: "  Keep this view  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save view" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Active users", "Keep this view", expect.any(Object)));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<SuperDataGridAddViewDialog open columns={fields} initialView={{ id: "v1", name: "Existing", notes: "note", filterModel: { items: [{ field: "name", operator: "contains", value: "A" }] } }} onClose={onClose} onSave={onSave} />);
    expect(screen.getByRole("heading", { name: "Edit view" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "View name" })).toHaveValue("Existing");
    fireEvent.change(screen.getByRole("textbox", { name: "View name" }), { target: { value: " Updated " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith("Updated", "note", expect.any(Object)));
  });
});

describe("grid filter panel", () => {
  it("applies typed filters, OR matching, and clears filter state", async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const model = { logicOperator: GridLogicOperator.Or, items: [
      { id: 1, field: "age", operator: ">", value: 22 },
      { id: 2, field: "active", operator: "is", value: false },
      { id: 3, field: "name", operator: "isAnyOf", value: ["A", "B"] },
      { id: 4, field: "joined", operator: "after", value: new Date("2026-01-01T00:00:00Z") },
    ] };
    render(<SuperDataGridFilterPanel open columns={fields} filterModel={model} onClose={onClose} onApply={onApply} />);
    expect(screen.getByText("Filter Data")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: "Apply Filters" }));
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ logicOperator: GridLogicOperator.Or, items: expect.arrayContaining([
      expect.objectContaining({ field: "age", value: 22 }),
      expect.objectContaining({ field: "active", value: false }),
      expect.objectContaining({ field: "name", value: ["A", "B"] }),
      expect.objectContaining({ field: "joined", value: expect.any(Date) }),
    ]) })));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("removes all filters, adds and deletes conditions, and allows closing", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<SuperDataGridFilterPanel open columns={fields} filterModel={{ items: [] }} onClose={onClose} onApply={onApply} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Filter" }));
    expect(screen.getByText("AND")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove filter 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove All" }));
    expect(onApply).toHaveBeenCalledWith({ items: [], logicOperator: GridLogicOperator.And });
    fireEvent.click(screen.getByRole("button", { name: "Close filter dialog" }));
    expect(onClose).toHaveBeenCalled();
  });
});
