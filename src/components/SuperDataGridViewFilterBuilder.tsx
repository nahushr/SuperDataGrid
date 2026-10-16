import React, { useMemo } from "react";
import type { SuperDataGridFilterModel } from "../types";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import SuperDataGridPolyFilterForm from "./SuperDataGridPolyFilterForm";

interface SuperDataGridViewFilterBuilderProps {
  columns: SuperDataGridFilterField[];
  initialModel: SuperDataGridFilterModel;
  onChange: (model: SuperDataGridFilterModel) => void;
}

export default function SuperDataGridViewFilterBuilder({
  columns,
  initialModel,
  onChange,
}: Readonly<SuperDataGridViewFilterBuilderProps>) {
  const filterableColumns = useMemo(
    () => columns.filter((column) => column.filterable !== false),
    [columns],
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
