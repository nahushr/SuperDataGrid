import React, { useId, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { SuperDataGridImageOptions } from "../../types";
import { getImageParts } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface ImagePreviewCellProps {
  value: unknown;
  field?: string;
  options?: SuperDataGridImageOptions;
}

export default function ImagePreviewCell({
  value,
  field,
  options = {},
}: ImagePreviewCellProps) {
  const [open, setOpen] = useState(false);
  const id = useId().replace(/:/g, "");
  const columnName = field ?? "image";
  const image = getImageParts(value, options);
  if (!image.src) return <span className={styles.emptyValue}>—</span>;

  const title = image.label || image.alt || columnName;
  return (
    <div className={styles.imageCell}>
      <button
        aria-label={`Open image preview for ${title}`}
        className={styles.imageButton}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        type="button"
      >
        <img alt={image.alt} className={styles.imageThumbnail} src={image.src} />
      </button>
      {image.label && <span className={styles.imageLabel}>{image.label}</span>}
      <Dialog
        aria-labelledby={`${id}-title`}
        onClose={() => setOpen(false)}
        open={open}
        PaperProps={{ className: styles.imageDialogPaper }}
      >
        <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
        <DialogContent className={styles.imageDialogContent}>
          <img alt={image.alt} className={styles.imageExpanded} src={image.src} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
