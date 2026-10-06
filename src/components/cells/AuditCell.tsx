import React from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleDetailsCell from "./PeopleDetailsCell";
import {
  formatAuditTimestamp,
  getAuditPeopleDetailsParts,
  getAuditTimestamp,
} from "../../utils/commonCellData";
import styles from "../../styles/common-cells.module.css";

interface AuditCellProps {
  value: unknown;
  row: unknown;
  field: string;
}

export default function AuditCell({ value, row, field }: Readonly<AuditCellProps>) {
  const timestamp = formatAuditTimestamp(
    getAuditTimestamp(value, row, field),
  );
  const person = getAuditPeopleDetailsParts(value, row, field);

  return (
    <div className={styles.auditCell}>
      <PeopleDetailsCell
        value={person}
        showPhone={false}
        showEmptyFields
      />
      <div className={styles.auditTimestamp}>
        <CalendarMonthIcon className={styles.auditIcon} aria-hidden="true" />
        <span className={styles.auditTimestampText}>{timestamp}</span>
      </div>
    </div>
  );
}
