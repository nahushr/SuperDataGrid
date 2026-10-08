import React from "react";
import {
  OpsModal as Dialog,
  OpsModalActions as DialogActions,
  OpsModalContent as DialogContent,
} from "@simplishelf/opscards";
import {
  Alert,
  Button,
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
    <Dialog
      className={muiControlUtilities}
      open={open}
      onClose={selectingAll ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      title={`Select ${itemLabel}`}
    >
      <DialogContent>
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
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button
          className={styles.actionButton}
          onClick={onClose}
          disabled={selectingAll}
        >
          Cancel
        </Button>
        <Button
          className={styles.actionButton}
          variant="outlined"
          onClick={onSelectCurrentPage}
          disabled={selectingAll}
        >
          Current page
        </Button>
        <Button
          className={styles.actionButton}
          variant="contained"
          onClick={onSelectAll}
          disabled={!canSelectAll || selectingAll}
          startIcon={selectingAll ? <CircularProgress size={16} /> : undefined}
        >
          {selectingAll ? "Selecting…" : "Select all"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
