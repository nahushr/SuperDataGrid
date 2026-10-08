import React from "react";
import type { GridFilterModel } from "@mui/x-data-grid";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import SuperDataGridPolyFilterForm from "./SuperDataGridPolyFilterForm";

interface SuperDataGridViewFilterBuilderProps {
  columns: SuperDataGridFilterField[];
  initialModel: GridFilterModel;
  onChange: (model: GridFilterModel) => void;
}

export default function SuperDataGridViewFilterBuilder({
  columns,
  initialModel,
  onChange,
}: Readonly<SuperDataGridViewFilterBuilderProps>) {
  const filterableColumns = columns.filter(
    (column) => column.filterable !== false,
  );

  return (
    <SuperDataGridPolyFilterForm
      columns={filterableColumns}
      initialModel={initialModel}
      onChange={onChange}
      title="View filters"
      addButtonLabel="Add condition"
      emptyMessage="No conditions yet. Add a filter to this view."
    />
  );
}
