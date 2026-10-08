import React, { useEffect, useState } from "react";
import {
  OpsModal as Dialog,
  OpsModalActions as DialogActions,
  OpsModalContent as DialogContent,
} from "@simplishelf/opscards";
import { Button, TextField } from "@mui/material";
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
      title={isEditing ? "Edit view" : "Add view"}
      subtitle="Set a name, notes, and filters for this saved view. Its filters are managed here and stay independent of the grid filter."
      closeButtonLabel="Close view dialog"
    >
      <form className={styles.form} onSubmit={saveView}>
        <DialogContent>
          <div className={styles.content}>
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
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
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
