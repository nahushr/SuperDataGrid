import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { OpsModalButton, OpsModalDialog } from "@simplishelf/opscards";
import {
  GridLogicOperator,
} from "@mui/x-data-grid";
import type { SuperDataGridFilterModel } from "../types";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import SuperDataGridPolyFilterForm from "./SuperDataGridPolyFilterForm";
import styles from "../styles/filter-panel.module.css";

interface FilterPanelProps {
  open: boolean;
  columns: SuperDataGridFilterField[];
  filterModel: SuperDataGridFilterModel;
  onClose: () => void;
  onApply: (model: SuperDataGridFilterModel) => void;
}

const EMPTY_FILTER_MODEL: SuperDataGridFilterModel = {
  items: [],
  logicOperator: GridLogicOperator.And,
};

export default function SuperDataGridFilterPanel({
  open,
  columns,
  filterModel,
  onClose,
  onApply,
}: Readonly<FilterPanelProps>) {
  const [draftModel, setDraftModel] = useState<SuperDataGridFilterModel>(filterModel);
  const [resetModel, setResetModel] = useState<SuperDataGridFilterModel>(filterModel);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setDraftModel(filterModel);
    setResetModel(filterModel);
    setResetKey((revision) => revision + 1);
  }, [filterModel, open]);

  const handleDraftChange = useCallback((model: SuperDataGridFilterModel) => {
    setDraftModel(model);
  }, []);

  const clearFilters = () => {
    setDraftModel(EMPTY_FILTER_MODEL);
    setResetModel(EMPTY_FILTER_MODEL);
    setResetKey((revision) => revision + 1);
    onApply(EMPTY_FILTER_MODEL);
  };

  const applyFilters = () => {
    onApply(draftModel);
    onClose();
  };

  return (
    <OpsModalDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      title="Filter Data"
      subtitle="Build filters from the columns shown in this grid."
      closeButtonLabel="Close filter dialog"
      classNames={{ content: styles.dialogContent, actions: styles.actions }}
      actions={(
        <>
          <OpsModalButton
            dataTestId="clear-grid-filters"
            onClick={clearFilters}
            appearance="danger"
          >
            Remove all
          </OpsModalButton>
          <Box className={styles.actionsSpacer} />
          <OpsModalButton
            dataTestId="cancel-grid-filters"
            onClick={onClose}
          >
            Cancel
          </OpsModalButton>
          <OpsModalButton
            dataTestId="apply-grid-filters"
            onClick={applyFilters}
            appearance="primary"
          >
            Apply filters
          </OpsModalButton>
        </>
      )}
    >
      <div>
        <SuperDataGridPolyFilterForm
          columns={columns}
          initialModel={resetModel}
          resetKey={resetKey}
          onChange={handleDraftChange}
          addButtonLabel="Add filter"
          startWithBlankCondition
          keepOneCondition
        />
      </div>
    </OpsModalDialog>
  );
}
