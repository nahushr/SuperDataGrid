import React from "react";
import {
  OpsModal as Dialog,
  OpsModalActions as DialogActions,
  OpsModalContent as DialogContent,
} from "@simplishelf/opscards";
import Button from "@mui/material/Button";
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
    <Dialog
      className={className}
      onClose={onClose}
      open={open}
      surfaceClassName={classes.paper}
      maxWidth="sm"
      fullWidth
      title={title}
      titleClassName={classes.title}
      headerClassName={classes.header}
      closeButtonLabel="Close error details"
      closeButtonClassName={classes.closeButton}
    >
      <DialogContent className={classes.content}>
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
      </DialogContent>
      <DialogActions className={classes.footer}>
        <Button
          className={classes.closeAction}
          variant="contained"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GridErrorDetailsDialog;
