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
import styles from "../styles/bulk-delete.module.css";

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
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="super-data-grid-bulk-delete-title"
      aria-describedby="super-data-grid-bulk-delete-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        id="super-data-grid-bulk-delete-title"
        className={styles.title}
      >
        Delete selected {itemLabel}?
      </DialogTitle>
      <DialogContent className={styles.content}>
        <Typography
          id="super-data-grid-bulk-delete-description"
          className={styles.description}
        >
          This will delete {selectedCount} selected {itemLabel}. This action
          cannot be undone.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
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
