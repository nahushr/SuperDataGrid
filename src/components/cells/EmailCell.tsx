import React from "react";
import EmailIcon from "@mui/icons-material/Email";
import type { SuperDataGridEmailOptions } from "../../types";
import { firstText } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

export interface EmailCellProps {
  value: unknown;
  options?: SuperDataGridEmailOptions;
  emptyText?: string;
  clickable?: boolean;
  wrap?: boolean;
  showIcon?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function EmailCell({
  value,
  options = {},
  emptyText = "—",
  clickable = true,
  wrap = true,
  showIcon = options.showIcon !== false,
  className,
  iconClassName,
  textClassName,
}: Readonly<EmailCellProps>) {
  const email = firstText(value, ["email", "emailAddress", "value"]);
  const record = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
  const label = firstText(record, ["label", "displayName"]) || email;
  if (!email) return <span className={`${styles.emptyValue} ${className ?? ""}`.trim()}>{emptyText}</span>;

  const content = (
    <>
      {showIcon && <EmailIcon className={`${styles.contactIcon} ${iconClassName ?? ""}`.trim()} aria-hidden="true" />}
      <span className={`${styles.contactText} ${wrap ? styles.contactTextWrap : styles.contactTextNoWrap} ${textClassName ?? ""}`.trim()}>{label}</span>
    </>
  );
  const rootClassName = `${styles.contactLink} ${styles.emailContactLink} ${className ?? ""}`.trim();
  return clickable
    ? <a className={rootClassName} href={`mailto:${email}`} onClick={(event) => event.stopPropagation()} title={`Email ${email}`}>{content}</a>
    : <span className={rootClassName}>{content}</span>;
}
