import React from "react";
import { OpsModalButton, OpsModalDialog } from "@simplishelf/opscards";
import {
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import styles from "../styles/selection-scope.module.css";
import { muiControlUtilities } from "../styles/tailwindClasses";

interface SuperDataGridSelectionScopeDialogProps {
  open: boolean;
  itemLabel: string;
  currentPageCount: number;
  totalCount: number;
  canSelectAll: boolean;
  selectingAll: boolean;
  error: string | null;
  onClose: () => void;
  onSelectCurrentPage: () => void;
  onSelectAll: () => void;
}

export default function SuperDataGridSelectionScopeDialog({
  open,
  itemLabel,
  currentPageCount,
  totalCount,
  canSelectAll,
  selectingAll,
  error,
  onClose,
  onSelectCurrentPage,
  onSelectAll,
}: Readonly<SuperDataGridSelectionScopeDialogProps>) {
  return (
    <OpsModalDialog
      open={open}
      onClose={() => { if (!selectingAll) onClose(); }}
      maxWidth="sm"
      fullWidth
      title={`Select ${itemLabel}`}
      closeButtonLabel="Close row selection dialog"
      disableCloseButton={selectingAll}
      classNames={{ actions: styles.actions }}
      actions={(
        <>
          <OpsModalButton
            dataTestId="cancel-row-selection"
            onClick={onClose}
            disabled={selectingAll}
          >
            Cancel
          </OpsModalButton>
          <OpsModalButton
            dataTestId="select-current-page"
            onClick={onSelectCurrentPage}
            disabled={selectingAll}
          >
            Current page
          </OpsModalButton>
          <OpsModalButton
            dataTestId="select-all-matching"
            appearance="primary"
            onClick={onSelectAll}
            disabled={!canSelectAll || selectingAll}
            startIcon={selectingAll ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {selectingAll ? "Selecting…" : "Select all"}
          </OpsModalButton>
        </>
      )}
    >
        <div className={styles.content}>
          <Typography className={styles.description}>
            Choose whether to select only the {currentPageCount} {itemLabel} on
            the current page or all {totalCount} matching {itemLabel}.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {!canSelectAll && (
            <Typography className={styles.helperText}>
              Provide a getAllRows callback to select all matching rows.
            </Typography>
          )}
        </div>
    </OpsModalDialog>
  );
}
