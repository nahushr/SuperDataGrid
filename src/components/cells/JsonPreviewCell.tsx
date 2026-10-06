import React, { useId, useMemo, useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { SuperDataGridJsonOptions } from "../../types";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

interface JsonPreviewCellProps {
  value: unknown;
  field?: string;
  options?: SuperDataGridJsonOptions;
}

function formatJson(value: unknown): string {
  try {
    if (typeof value === "string") {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return JSON.stringify(value, null, 2);
      }
    }
    return JSON.stringify(value, null, 2) ?? toDisplayValue(value);
  } catch {
    return toDisplayValue(value);
  }
}

function compactJson(value: unknown): string {
  try {
    if (typeof value === "string") {
      try {
        return JSON.stringify(JSON.parse(value));
      } catch {
        return value;
      }
    }
    return JSON.stringify(value) ?? toDisplayValue(value);
  } catch {
    return toDisplayValue(value);
  }
}

export default function JsonPreviewCell({
  value,
  field,
  options = {},
}: JsonPreviewCellProps) {
  const [open, setOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const id = useId().replace(/:/g, "");
  const columnName = field ?? "value";
  const formatted = useMemo(() => formatJson(value), [value]);
  const compact = compactJson(value);
  const maxPreviewLength = options.maxPreviewLength ?? 88;
  const preview = compact.length > maxPreviewLength
    ? `${compact.slice(0, maxPreviewLength).trimEnd()}…`
    : compact;

  if (value == null) return <span className={styles.emptyValue}>—</span>;

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopyMessage("Copied to clipboard");
    } catch {
      setCopyMessage("Clipboard access is unavailable");
    }
  };

  return (
    <>
      <button
        aria-label={`Open JSON preview for ${columnName}`}
        className={styles.jsonPreviewButton}
        onClick={(event) => {
          event.stopPropagation();
          setCopyMessage("");
          setOpen(true);
        }}
        type="button"
      >
        <span className={styles.jsonPreviewText}>{preview}</span>
      </button>
      <Dialog
        aria-labelledby={`${id}-title`}
        className={styles.jsonDialog}
        onClose={() => setOpen(false)}
        open={open}
        PaperProps={{ className: styles.jsonDialogPaper }}
      >
        <DialogTitle id={`${id}-title`}>JSON preview</DialogTitle>
        <DialogContent className={styles.jsonDialogContent}>
          <pre className={styles.jsonBlock}>{formatted}</pre>
        </DialogContent>
        <DialogActions className={styles.jsonDialogActions}>
          <span aria-live="polite" className={styles.copiedMessage}>
            {copyMessage}
          </span>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              void copyJson();
            }}
            startIcon={<ContentCopyIcon />}
          >
            Copy JSON
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
