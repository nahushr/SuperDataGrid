import React from "react";
import Tooltip from "@mui/material/Tooltip";
import type { SuperDataGridLongTextOptions } from "../../types";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

interface LongTextCellProps {
  value: unknown;
  options?: SuperDataGridLongTextOptions;
}

export default function LongTextCell({ value, options = {} }: Readonly<LongTextCellProps>) {
  const text = toDisplayValue(value);
  if (!text) return <span className={styles.emptyValue}>—</span>;

  const maxPreviewLength = options.maxPreviewLength ?? 140;
  const preview = text.length > maxPreviewLength
    ? `${text.slice(0, maxPreviewLength).trimEnd()}…`
    : text;

  return (
    <Tooltip title={text} placement="top-start">
      <span className={styles.longText} title={text}>
        {preview}
      </span>
    </Tooltip>
  );
}
