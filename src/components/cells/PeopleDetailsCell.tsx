import React from "react";
import Avatar from "@mui/material/Avatar";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import type { GridRowId } from "@mui/x-data-grid";
import {
  getPeopleAvatarParts,
  getPeopleDetailsParts,
  getPhoneDisplay,
} from "../../utils/commonCellData";
import { getAvatarColorIndex } from "../../utils/avatar";
import styles from "../../styles/common-cells.module.css";

const AVATAR_COLOR_CLASSES = [
  styles.avatarColor0,
  styles.avatarColor1,
  styles.avatarColor2,
  styles.avatarColor3,
  styles.avatarColor4,
  styles.avatarColor5,
  styles.avatarColor6,
  styles.avatarColor7,
  styles.avatarColor8,
  styles.avatarColor9,
] as const;

interface PeopleDetailsCellProps {
  value: unknown;
  rowId?: GridRowId;
  row?: unknown;
  emptyText?: string;
  showPhone?: boolean;
  showEmptyFields?: boolean;
  showAvatar?: boolean;
}

export default function PeopleDetailsCell({
  value,
  rowId,
  row,
  emptyText = "—",
  showPhone = true,
  showEmptyFields = false,
  showAvatar = false,
}: Readonly<PeopleDetailsCellProps>) {
  const { name, email, phone } = getPeopleDetailsParts(value);
  const avatar = getPeopleAvatarParts(value, row);
  const formattedPhone = showPhone && phone ? getPhoneDisplay(phone) : null;
  const avatarColorIndex = getAvatarColorIndex(rowId ?? "unknown");
  const avatarColorClass = AVATAR_COLOR_CLASSES[avatarColorIndex];

  if (!name && !email && !formattedPhone && !showEmptyFields) {
    return <span className={styles.emptyValue}>{emptyText}</span>;
  }

  return (
    <div className={styles.peopleDetails}>
      {(name || showEmptyFields) && (
        <div className={styles.personRow}>
          {showAvatar ? (
            <Avatar
              className={`${styles.personAvatar} ${avatarColorClass}`}
              src={avatar.photoUrl || undefined}
              alt={name || avatar.firstName}
              aria-hidden="true"
            >
              {avatar.firstName.slice(0, 1).toUpperCase() || "?"}
            </Avatar>
          ) : (
            <PersonIcon className={styles.personIcon} aria-hidden="true" />
          )}
          <span className={styles.personName} title={name}>
            {name || emptyText}
          </span>
        </div>
      )}
      {(email || showEmptyFields) &&
        (email ? (
          <a
            className={styles.contactLink}
            href={`mailto:${email}`}
            onClick={(event) => event.stopPropagation()}
            title={`Email ${email}`}
          >
            <EmailIcon className={styles.contactIcon} aria-hidden="true" />
            <span className={styles.contactText}>{email}</span>
          </a>
        ) : (
          <span className={styles.emptyContactValue}>{emptyText}</span>
        ))}
      {formattedPhone && (
        <a
          className={`${styles.contactLink} ${styles.phoneContactLink}`}
          href={formattedPhone.href || undefined}
          onClick={(event) => event.stopPropagation()}
          title={`Call ${formattedPhone.display}`}
        >
          <PhoneIcon className={styles.contactIcon} aria-hidden="true" />
          <span className={styles.phoneContactText}>{formattedPhone.display}</span>
        </a>
      )}
    </div>
  );
}
