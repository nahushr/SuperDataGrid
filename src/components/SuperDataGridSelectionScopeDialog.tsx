import React from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import styles from "../styles/selection-scope.module.css";

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
}: SuperDataGridSelectionScopeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={selectingAll ? undefined : onClose}
      aria-labelledby="super-data-grid-selection-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        id="super-data-grid-selection-title"
        className={styles.title}
      >
        Select {itemLabel}
      </DialogTitle>
      <DialogContent className={styles.content}>
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
