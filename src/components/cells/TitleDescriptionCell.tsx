import React from "react";
import Tooltip from "@mui/material/Tooltip";
import type { SuperDataGridTitleDescriptionOptions } from "../../types";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

interface TitleDescriptionCellProps {
  value: unknown;
  row: Readonly<Record<string, unknown>>;
  options?: SuperDataGridTitleDescriptionOptions;
}

export default function TitleDescriptionCell({
  value,
  row,
  options = {},
}: Readonly<TitleDescriptionCellProps>) {
  const title = toDisplayValue(value);
  const description = options.descriptionField
    ? toDisplayValue(row[options.descriptionField])
    : "";

  if (!title && !description) return <span className={styles.emptyValue}>—</span>;

  return (
    <div className={styles.titleDescription}>
      <span className={styles.titleDescriptionPrimary} title={title}>
        {title || "—"}
      </span>
      {description && (
        <Tooltip title={description} placement="top-start">
          <span
            className={styles.titleDescriptionSecondary}
          >
            {description}
          </span>
        </Tooltip>
      )}
    </div>
  );
}
