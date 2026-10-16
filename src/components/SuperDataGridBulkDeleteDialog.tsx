import React from "react";
import { OpsModalButton, OpsModalDialog } from "@simplishelf/opscards";
import {
  Alert,
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
    <OpsModalDialog
      open={open}
      onClose={() => { if (!loading) onClose(); }}
      maxWidth="sm"
      fullWidth
      title={`Delete selected ${itemLabel}?`}
      subtitle={`This will delete ${selectedCount} selected ${itemLabel}. This action cannot be undone.`}
      closeButtonLabel="Close bulk delete dialog"
      disableCloseButton={loading}
      classNames={{ actions: styles.actions }}
      actions={(
        <>
          <OpsModalButton
            dataTestId="cancel-bulk-delete"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </OpsModalButton>
          <OpsModalButton
            dataTestId="confirm-bulk-delete"
            appearance="danger"
            onClick={onConfirm}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {loading ? "Deleting…" : "Delete"}
          </OpsModalButton>
        </>
      )}
    >
      <div className={styles.content}>
        <Typography className={styles.description}>
          Review the selected record count before confirming deletion.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </div>
    </OpsModalDialog>
  );
}
