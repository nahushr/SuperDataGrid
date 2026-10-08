import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { GridFilterModel } from "@mui/x-data-grid";
import type { SuperDataGridView } from "../types";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import SuperDataGridViewFilterBuilder from "./SuperDataGridViewFilterBuilder";
import styles from "../styles/add-view.module.css";
import { muiControlUtilities } from "../styles/tailwindClasses";

interface SuperDataGridAddViewDialogProps {
  open: boolean;
  columns: SuperDataGridFilterField[];
  initialView: SuperDataGridView | null;
  onClose: () => void;
  onSave: (name: string, notes: string, filterModel: GridFilterModel) => void;
}

const EMPTY_FILTER_MODEL: GridFilterModel = { items: [] };

export default function SuperDataGridAddViewDialog({
  open,
  columns,
  initialView,
  onClose,
  onSave,
}: Readonly<SuperDataGridAddViewDialogProps>) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [filterModel, setFilterModel] = useState<GridFilterModel>(
    EMPTY_FILTER_MODEL,
  );

  useEffect(() => {
    if (open) {
      setName(initialView?.name ?? "");
      setNotes(initialView?.notes ?? "");
      setFilterModel(initialView?.filterModel ?? EMPTY_FILTER_MODEL);
    }
  }, [initialView, open]);

  const saveView = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName, notes.trim(), filterModel);
    setName("");
    setNotes("");
  };

  const isEditing = initialView != null;

  return (
    <Dialog
      className={muiControlUtilities}
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="super-data-grid-view-dialog-title"
      PaperProps={{ className: styles.paper }}
    >
      <form className={styles.form} onSubmit={saveView}>
        <DialogTitle id="super-data-grid-view-dialog-title" className={styles.title}>
          <div>
            <Typography component="h2" className={styles.heading}>
              {isEditing ? "Edit view" : "Add view"}
            </Typography>
            <Typography className={styles.description}>
              Set a name, notes, and filters for this saved view. Its filters are
              managed here and stay independent of the grid filter.
            </Typography>
          </div>
          <IconButton
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close view dialog"
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent className={styles.content}>
          <TextField
            autoFocus
            required
            fullWidth
            label="View name"
            className={styles.field}
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: 150 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Notes (optional)"
            className={styles.field}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          {open && (
            <SuperDataGridViewFilterBuilder
              columns={columns}
              initialModel={initialView?.filterModel ?? EMPTY_FILTER_MODEL}
              onChange={setFilterModel}
            />
          )}
        </DialogContent>
        <DialogActions className={styles.actions}>
          <Button className={styles.actionButton} onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={styles.actionButton}
            type="submit"
            variant="contained"
            disabled={name.trim().length === 0}
          >
            {isEditing ? "Save changes" : "Save view"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
