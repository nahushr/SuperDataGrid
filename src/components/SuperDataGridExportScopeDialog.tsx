import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import styles from "../styles/export-scope.module.css";
import { muiControlUtilities } from "../styles/tailwindClasses";

interface SuperDataGridExportScopeDialogProps {
  open: boolean;
  formatLabel: string;
  canExportAllData: boolean;
  onClose: () => void;
  onCurrentView: () => void;
  onAllData: () => void;
}

export default function SuperDataGridExportScopeDialog({
  open,
  formatLabel,
  canExportAllData,
  onClose,
  onCurrentView,
  onAllData,
}: Readonly<SuperDataGridExportScopeDialogProps>) {
  return (
    <Dialog
      className={muiControlUtilities}
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle className={styles.title}>Export {formatLabel}</DialogTitle>
      <DialogContent className={styles.content}>
        <Typography className={styles.description}>
          Choose which rows to include in this export.
        </Typography>
        <Button
          variant="outlined"
          className={styles.scopeButton}
          onClick={onCurrentView}
        >
          <span className={styles.scopeButtonContent}>
            <strong>Current table view</strong>
            <span>Export the rows on the current page.</span>
          </span>
        </Button>
        <Button
          variant="contained"
          className={styles.scopeButton}
          disabled={!canExportAllData}
          onClick={onAllData}
        >
          <span className={styles.scopeButtonContent}>
            <strong>All matching data</strong>
            <span>Export every page using the current filters.</span>
          </span>
        </Button>
        {!canExportAllData && (
          <Typography className={styles.helperText}>
            Add a getAllData callback to enable all-pages export.
          </Typography>
        )}
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button className={styles.cancelButton} onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
