import React from "react";
import PersonIcon from "@mui/icons-material/Person";
import type { ReactNode } from "react";
import EmailCell from "./EmailCell";
import PhoneCell from "./PhoneCell";
import styles from "../../styles/common-cells.module.css";

export interface UserContactCellProps {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | number | null;
  label?: string;
  showName?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showEmptyFields?: boolean;
  emptyText?: string;
  wrap?: boolean;
  testId?: string;
  className?: string;
  nameClassName?: string;
  icon?: ReactNode;
}

function getName({ name, firstName, lastName }: UserContactCellProps): string {
  const combined = [firstName, lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .trim();
  if (combined) return combined;
  return name && !name.includes("@") ? name.trim() : "";
}

export function UserContactCell({
  name,
  firstName,
  lastName,
  email,
  phone,
  label,
  showName = true,
  showEmail = true,
  showPhone = true,
  showEmptyFields = false,
  emptyText = "—",
  wrap = true,
  testId = "user-contact-cell",
  className,
  nameClassName,
  icon,
}: UserContactCellProps) {
  const displayName = getName({ name, firstName, lastName });
  const hasEmail = Boolean(email?.trim());
  const hasPhone = phone != null && String(phone).trim() !== "";
  const labelTone = label === "Assigned To"
    ? styles.contactLabelPrimary
    : label === "Created By"
      ? styles.contactLabelSecondary
      : styles.contactLabel;

  return (
    <div className={`${styles.peopleDetails} ${className ?? ""}`.trim()} data-test-id={testId}>
      {label && <span className={`${styles.contactLabel} ${labelTone}`}>{label}</span>}
      {showName && (displayName || showEmptyFields) && (
        <div className={styles.personRow}>
          {icon ?? <PersonIcon className={styles.personIcon} aria-hidden="true" />}
          <span className={`${styles.personName} ${nameClassName ?? ""}`.trim()} title={displayName || emptyText}>
            {displayName || emptyText}
          </span>
        </div>
      )}
      {showEmail && (hasEmail || showEmptyFields) && (
        hasEmail
          ? <EmailCell value={email} wrap={wrap} />
          : <span className={styles.emptyContactValue}>{emptyText}</span>
      )}
      {showPhone && (hasPhone || showEmptyFields) && (
        hasPhone
          ? <PhoneCell value={phone} wrap={wrap} />
          : <span className={styles.emptyContactValue}>{emptyText}</span>
      )}
    </div>
  );
}

export default UserContactCell;
