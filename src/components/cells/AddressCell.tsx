import React from "react";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { getAddressParts } from "../../utils/commonCellData";
import UserContactCell from "./UserContactCell";
import styles from "../../styles/common-cells.module.css";

export interface AddressCellClasses {
  root?: string;
  icon?: string;
  street?: string;
  cityLine?: string;
}

export interface AddressCellProps {
  value?: unknown;
  addresses?: readonly unknown[] | null;
  emptyText?: string;
  fallbackText?: string;
  showContactInfo?: boolean;
  showEmptyContactFields?: boolean;
  containerClassName?: string;
  iconClassName?: string;
  emptyClassName?: string;
  tooltipClassName?: string;
  iconColor?: string;
  testId?: string;
  className?: string;
  classes?: AddressCellClasses;
}

export default function AddressCell({
  value,
  addresses,
  emptyText = "—",
  fallbackText,
  showContactInfo = true,
  showEmptyContactFields = true,
  containerClassName,
  iconClassName,
  emptyClassName,
  iconColor,
  testId = "address-cell",
  className,
  classes = {},
}: Readonly<AddressCellProps>) {
  const { street, cityLine, name, email, phone } = getAddressParts(value ?? addresses);

  if (!street && !cityLine && !name && !email && !phone) {
    return <span className={`${styles.emptyValue} ${emptyClassName ?? ""}`.trim()} data-test-id={testId}>{fallbackText ?? emptyText}</span>;
  }

  return (
    <div
      className={`${styles.addressCell} ${containerClassName ?? ""} ${classes.root ?? ""} ${className ?? ""}`.trim()}
      data-test-id={testId}
      aria-label={[street, cityLine, name, email, phone].filter(Boolean).join(", ") || fallbackText || emptyText}
    >
      {(street || fallbackText) && (
        <div className={styles.addressStreetRow}>
          <PlaceOutlinedIcon
            className={`${styles.addressIcon} ${iconClassName ?? ""} ${classes.icon ?? ""}`.trim()}
            style={iconColor ? { color: iconColor } : undefined}
            aria-hidden="true"
          />
          <span className={`${styles.addressStreet} ${classes.street ?? ""}`.trim()} title={street || fallbackText}>{street || fallbackText}</span>
        </div>
      )}
      {cityLine && (
        <div className={street ? styles.addressSubtext : styles.addressStreetRow}>
          {!street && (
            <PlaceOutlinedIcon
              className={`${styles.addressIcon} ${iconClassName ?? ""} ${classes.icon ?? ""}`.trim()}
              style={iconColor ? { color: iconColor } : undefined}
              aria-hidden="true"
            />
          )}
          <span className={`${styles.addressSubtextText} ${classes.cityLine ?? ""}`.trim()} title={cityLine}>{cityLine}</span>
        </div>
      )}
      {showContactInfo && (name || email || phone || showEmptyContactFields) && (
        <div className={styles.addressContact}>
          <UserContactCell
            name={name}
            email={email}
            phone={phone}
            emptyText={emptyText}
            showEmptyFields={showEmptyContactFields}
            testId={`${testId}-contact`}
          />
        </div>
      )}
    </div>
  );
}
