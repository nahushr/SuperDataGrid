import React, { useMemo, useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  PolyFormModal,
  PolyFormModalButton,
} from "@simplishelf/polyform";
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
}: Readonly<JsonPreviewCellProps>) {
  const [open, setOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
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
      <PolyFormModal
        onClose={() => setOpen(false)}
        open={open}
        maxWidth="sm"
        title="JSON preview"
        actions={(
          <>
            <span aria-live="polite" className={styles.copiedMessage}>
              {copyMessage}
            </span>
            <PolyFormModalButton
              dataTestId="copy-json-preview"
              onClick={() => void copyJson()}
              startIcon={<ContentCopyIcon />}
            >
              Copy JSON
            </PolyFormModalButton>
            <PolyFormModalButton onClick={() => setOpen(false)} appearance="primary">
              Close
            </PolyFormModalButton>
          </>
        )}
      >
        <pre className={styles.jsonBlock}>{formatted}</pre>
      </PolyFormModal>
    </>
  );
}
