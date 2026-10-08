import React, { useId } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
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
  const id = useId().replace(/:/g, "");
  const classNames = (base: string, override?: string) =>
    `${base} ${override ?? ""}`.trim();

  return (
    <Dialog
      aria-labelledby={`grid-error-details-title-${id}`}
      className={className}
      onClose={onClose}
      open={open}
      PaperProps={{
        className: classNames(styles.paper, classes.paper),
      }}
      maxWidth="sm"
      fullWidth
    >
      <Box className={classNames(styles.header, classes.header)}>
        <DialogTitle
          className={classNames(styles.title, classes.title)}
          id={`grid-error-details-title-${id}`}
        >
          {title}
        </DialogTitle>
        <IconButton
          aria-label="Close error details"
          className={classNames(styles.closeButton, classes.closeButton)}
          onClick={onClose}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent className={classNames(styles.content, classes.content)}>
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
      <DialogActions className={classNames(styles.footer, classes.footer)}>
        <Button
          className={classNames(styles.closeAction, classes.closeAction)}
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GridErrorDetailsDialog;
