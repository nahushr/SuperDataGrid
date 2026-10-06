import React from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { getAddressParts } from "../../utils/commonCellData";
import PeopleDetailsCell from "./PeopleDetailsCell";
import styles from "../../styles/common-cells.module.css";

interface AddressCellProps {
  value: unknown;
  emptyText?: string;
}

export default function AddressCell({
  value,
  emptyText = "—",
}: Readonly<AddressCellProps>) {
  const { street, cityLine, name, email, phone } = getAddressParts(value);

  if (!street && !cityLine && !name && !email && !phone) {
    return <span className={styles.emptyValue}>{emptyText}</span>;
  }

  return (
    <div className={styles.addressCell}>
      {street && (
        <div className={styles.addressStreetRow}>
          <LocationOnIcon className={styles.addressIcon} aria-hidden="true" />
          <span className={styles.addressStreet}>{street}</span>
        </div>
      )}
      {cityLine && (
        <div className={street ? styles.addressSubtext : styles.addressStreetRow}>
          {!street && (
            <LocationOnIcon className={styles.addressIcon} aria-hidden="true" />
          )}
          <span className={styles.addressSubtextText}>{cityLine}</span>
        </div>
      )}
      {(name || email || phone) && (
        <div className={styles.addressContact}>
          <PeopleDetailsCell
            value={{ name, email, phone }}
            emptyText={emptyText}
          />
        </div>
      )}
    </div>
  );
}
