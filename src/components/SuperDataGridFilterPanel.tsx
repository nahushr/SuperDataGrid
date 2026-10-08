import React, { useCallback, useEffect, useState } from "react";
import {
  OpsModal as Dialog,
  OpsModalActions as DialogActions,
  OpsModalContent as DialogContent,
} from "@simplishelf/opscards";
import { Box, Button } from "@mui/material";
import {
  GridLogicOperator,
  type GridFilterModel,
} from "@mui/x-data-grid";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import SuperDataGridPolyFilterForm from "./SuperDataGridPolyFilterForm";
import styles from "../styles/filter-panel.module.css";
import { muiControlUtilities } from "../styles/tailwindClasses";

interface FilterPanelProps {
  open: boolean;
  columns: SuperDataGridFilterField[];
  filterModel: GridFilterModel;
  onClose: () => void;
  onApply: (model: GridFilterModel) => void;
}

const EMPTY_FILTER_MODEL: GridFilterModel = {
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
  const [draftModel, setDraftModel] = useState<GridFilterModel>(filterModel);
  const [resetModel, setResetModel] = useState<GridFilterModel>(filterModel);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setDraftModel(filterModel);
    setResetModel(filterModel);
    setResetKey((revision) => revision + 1);
  }, [filterModel, open]);

  const handleDraftChange = useCallback((model: GridFilterModel) => {
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
    <Dialog
      className={muiControlUtilities}
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      title="Filter Data"
      subtitle="Build filters from the columns shown in this grid."
      closeButtonLabel="Close filter dialog"
    >
      <DialogContent className={styles.dialogContent}>
        <SuperDataGridPolyFilterForm
          columns={columns}
          initialModel={resetModel}
          resetKey={resetKey}
          onChange={handleDraftChange}
          addButtonLabel="Add filter"
          startWithBlankCondition
          keepOneCondition
        />
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button
          data-testid="clear-grid-filters"
          onClick={clearFilters}
          variant="outlined"
          color="secondary"
        >
          Remove all
        </Button>
        <Box className={styles.actionsSpacer} />
        <Button data-testid="cancel-grid-filters" onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          data-testid="apply-grid-filters"
          onClick={applyFilters}
          variant="contained"
        >
          Apply filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}
