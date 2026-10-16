import React from "react";
import { OpsModalButton, OpsModalDialog } from "@simplishelf/opscards";
import Box from "@mui/material/Box";
import styles from "../styles/error-dialog.module.css";

export interface GridErrorDetailsDialogClasses {
  paper?: string;
  header?: string;
  title?: string;
  closeButton?: string;
  content?: string;
  identifier?: string;
  list?: string;
  item?: string;
  bullet?: string;
  message?: string;
  footer?: string;
  closeAction?: string;
}

export interface GridErrorDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  errors: readonly string[];
  rowIdentifier?: string;
  className?: string;
  classes?: GridErrorDetailsDialogClasses;
}

/** A styled, reusable dialog for validation or row-level grid errors. */
export function GridErrorDetailsDialog({
  open,
  onClose,
  title = "Validation Errors",
  errors,
  rowIdentifier,
  className,
  classes = {},
}: Readonly<GridErrorDetailsDialogProps>) {
  const classNames = (base: string, override?: string) =>
    `${base} ${override ?? ""}`.trim();

  return (
    <OpsModalDialog
      onClose={onClose}
      open={open}
      maxWidth="sm"
      fullWidth
      title={title}
      closeButtonLabel="Close error details"
      classNames={{
        paper: classNames(className ?? "", classes.paper),
        title: classes.title,
        header: classes.header,
        closeButton: classes.closeButton,
        content: classes.content,
        actions: classes.footer,
      }}
      actions={(
        <OpsModalButton
          className={classes.closeAction}
          dataTestId="close-grid-error-details"
          appearance="primary"
          onClick={onClose}
        >
          Close
        </OpsModalButton>
      )}
    >
      <>
        {rowIdentifier && (
          <Box className={classNames(styles.identifier, classes.identifier)}>
            {rowIdentifier}
          </Box>
        )}
        <Box component="ul" className={classNames(styles.list, classes.list)}>
          {errors.map((error, index) => (
            <Box
              component="li"
              key={`${error}-${index}`}
              className={classNames(styles.item, classes.item)}
            >
              <span className={classNames(styles.bullet, classes.bullet)} aria-hidden="true">
                •
              </span>
              <span className={classNames(styles.message, classes.message)}>{error}</span>
            </Box>
          ))}
        </Box>
      </>
    </OpsModalDialog>
  );
}

export default GridErrorDetailsDialog;
