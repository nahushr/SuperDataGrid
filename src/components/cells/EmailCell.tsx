import React from "react";
import EmailIcon from "@mui/icons-material/Email";
import type { SuperDataGridEmailOptions } from "../../types";
import { firstText } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface EmailCellProps {
  value: unknown;
  options?: SuperDataGridEmailOptions;
}

export default function EmailCell({ value, options = {} }: EmailCellProps) {
  const email = firstText(value, ["email", "emailAddress", "value"]);
  const record = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
  const label = firstText(record, ["label", "displayName"]) || email;
  if (!email) return <span className={styles.emptyValue}>—</span>;

  return (
    <a
      className={styles.contactLink}
      href={`mailto:${email}`}
      onClick={(event) => event.stopPropagation()}
      title={`Email ${email}`}
    >
      {options.showIcon !== false && (
        <EmailIcon className={styles.contactIcon} aria-hidden="true" />
      )}
      <span className={styles.contactText}>{label}</span>
    </a>
  );
}
