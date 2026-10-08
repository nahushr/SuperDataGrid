import React from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { UserContactCellProps } from "./UserContactCell";
import UserContactCell from "./UserContactCell";
import { UTCTimestampCell } from "./UTCTimestampCell";
import styles from "../../styles/common-cells.module.css";

export interface CreatedByCellProps extends Omit<UserContactCellProps, "showPhone" | "showEmptyFields"> {
  created?: string | Date | null;
  createdEmptyText?: string;
  showEmptyFields?: boolean;
  className?: string;
}

export function CreatedByCell({
  created,
  createdEmptyText = "—",
  testId = "created-by-cell",
  showEmptyFields = true,
  className,
  ...contactProps
}: CreatedByCellProps) {
  return (
    <div className={`${styles.auditCell} ${className ?? ""}`.trim()} data-test-id={testId}>
      <UserContactCell
        {...contactProps}
        showName
        showPhone={false}
        showEmptyFields={showEmptyFields}
        testId={`${testId}-contact`}
      />
      <div className={styles.auditTimestamp}>
        <CalendarMonthIcon className={styles.auditIcon} aria-hidden="true" />
        <UTCTimestampCell
          value={created}
          formatString="do MMM yyyy, h:mm a"
          emptyText={createdEmptyText}
        />
      </div>
    </div>
  );
}

export default CreatedByCell;
