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
import styles from "../styles/bulk-delete.module.css";
import { muiControlUtilities } from "../styles/tailwindClasses";

interface SuperDataGridBulkDeleteDialogProps {
  open: boolean;
  itemLabel: string;
  selectedCount: number;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SuperDataGridBulkDeleteDialog({
  open,
  itemLabel,
  selectedCount,
  loading,
  error,
  onClose,
  onConfirm,
}: Readonly<SuperDataGridBulkDeleteDialogProps>) {
  return (
    <Dialog
      className={muiControlUtilities}
      open={open}
      onClose={loading ? undefined : onClose}
      aria-describedby="super-data-grid-bulk-delete-description"
      maxWidth="sm"
      fullWidth
      title={`Delete selected ${itemLabel}?`}
    >
      <DialogContent>
        <div className={styles.content}>
          <Typography
            id="super-data-grid-bulk-delete-description"
            className={styles.description}
          >
            This will delete {selectedCount} selected {itemLabel}. This action
            cannot be undone.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
        </div>
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button
          className={styles.actionButton}
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className={styles.actionButton}
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
