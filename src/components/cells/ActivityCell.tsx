import React from "react";
import Tooltip from "@mui/material/Tooltip";
import type { SuperDataGridActivityOptions } from "../../types";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

interface ActivityCellProps {
  row: Readonly<Record<string, unknown>>;
  options?: SuperDataGridActivityOptions;
}

export default function ActivityCell({
  row,
  options = {},
}: Readonly<ActivityCellProps>) {
  const action = toDisplayValue(row[options.actionField ?? "action"]).trim();
  const description = toDisplayValue(
    row[options.descriptionField ?? "description"],
  ).trim();
  const level = toDisplayValue(row[options.levelField ?? "logLevel"])
    .trim()
    .toUpperCase();

  if (!action && !description && !level) {
    return <span className={styles.emptyValue}>—</span>;
  }

  const content = (
    <div
      className={styles.activityCell}
      aria-label={[action, description, level].filter(Boolean).join(". ")}
    >
      <div className={styles.activityHeading}>
        <span className={styles.activityAction} title={action}>
          {action || "Activity"}
        </span>
        {level && (
          <span
            className={styles.activityLevel}
            data-level={level}
            aria-label={`Level ${level}`}
          >
            <span className={styles.activityLevelDot} aria-hidden="true" />
            {level}
          </span>
        )}
      </div>
      {description && (
        <span className={styles.activityDescription} title={description}>
          {description}
        </span>
      )}
    </div>
  );

  return description ? (
    <Tooltip title={description} placement="top-start">
      {content}
    </Tooltip>
  ) : content;
}
