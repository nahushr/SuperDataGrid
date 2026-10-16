import React, { useEffect, useMemo, useState } from "react";
import {
  FieldType,
  PolyForm,
  type FormCardConfig,
} from "@simplishelf/polyform";
import { OpsModalButton, OpsModalDialog } from "@simplishelf/opscards";
import { useForm } from "react-hook-form";
import type { SuperDataGridFilterModel, SuperDataGridView } from "../types";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import SuperDataGridViewFilterBuilder from "./SuperDataGridViewFilterBuilder";
import styles from "../styles/add-view.module.css";

interface SuperDataGridAddViewDialogProps {
  open: boolean;
  columns: SuperDataGridFilterField[];
  initialView: SuperDataGridView | null;
  onClose: () => void;
  onSave: (name: string, notes: string, filterModel: SuperDataGridFilterModel) => void;
}

interface ViewFormValues {
  name: string;
  notes: string;
}

const EMPTY_FILTER_MODEL: SuperDataGridFilterModel = { items: [] };

function createDefaultViewFormValues(): ViewFormValues {
  return { name: "", notes: "" };
}

export default function SuperDataGridAddViewDialog({
  open,
  columns,
  initialView,
  onClose,
  onSave,
}: Readonly<SuperDataGridAddViewDialogProps>) {
  const [filterModel, setFilterModel] = useState<SuperDataGridFilterModel>(
    EMPTY_FILTER_MODEL,
  );
  const { control, handleSubmit, reset, watch } = useForm<ViewFormValues>({
    defaultValues: createDefaultViewFormValues(),
  });
  const name = watch("name");

  useEffect(() => {
    if (!open) return;
    reset({
      name: initialView?.name ?? "",
      notes: initialView?.notes ?? "",
    });
    setFilterModel(initialView?.filterModel ?? EMPTY_FILTER_MODEL);
  }, [initialView, open, reset]);

  const formCards = useMemo<FormCardConfig<ViewFormValues>[]>(
    () => [
      {
        id: "saved-view-details",
        sections: [
          {
            fields: [
              {
                name: "name",
                label: "View name",
                type: FieldType.Text,
                variant: "outlined",
                required: true,
                maxLength: 150,
                placeholder: "e.g. Active users",
                gridSize: { xs: 12, sm: 12 },
              },
              {
                name: "notes",
                label: "Notes (optional)",
                type: FieldType.Textarea,
                variant: "outlined",
                rows: 3,
                placeholder: "Add a short note about this view",
                gridSize: { xs: 12, sm: 12 },
              },
            ],
          },
        ],
      },
    ],
    [],
  );

  const saveView = handleSubmit((values) => {
    const trimmedName = values.name.trim();
    if (!trimmedName) return;
    onSave(trimmedName, values.notes.trim(), filterModel);
  });

  const isEditing = initialView != null;

  return (
    <OpsModalDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      title={isEditing ? "Edit view" : "Add view"}
      subtitle="Give this view a name and add optional filters."
      closeButtonLabel="Close view dialog"
      classNames={{ content: styles.dialogContent, actions: styles.actions }}
      actions={(
        <>
          <OpsModalButton
            dataTestId="cancel-saved-view"
            onClick={onClose}
          >
            Cancel
          </OpsModalButton>
          <OpsModalButton
            dataTestId="save-saved-view"
            type="submit"
            form="super-data-grid-saved-view-form"
            appearance="primary"
            disabled={name.trim().length === 0}
          >
            {isEditing ? "Save changes" : "Save view"}
          </OpsModalButton>
        </>
      )}
    >
      <form
        id="super-data-grid-saved-view-form"
        className={styles.form}
        onSubmit={saveView}
      >
          <div className={styles.content}>
            <PolyForm
              cards={formCards}
              control={control}
              classNames={{ fieldGridItem: styles.polyFormField }}
            />
            {open && (
              <SuperDataGridViewFilterBuilder
                columns={columns}
                initialModel={initialView?.filterModel ?? EMPTY_FILTER_MODEL}
                onChange={setFilterModel}
              />
            )}
          </div>
      </form>
    </OpsModalDialog>
  );
}
