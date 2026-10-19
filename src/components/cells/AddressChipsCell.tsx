import React, { useState, type ReactElement } from "react";
import Popover from "@mui/material/Popover";
import { AddressPopoverCard, type AddressCardData } from "@simplishelf/opscards";
import { getAddressParts } from "../../utils/commonCellData";
import styles from "../../styles/common-cells.module.css";

type AddressRecord = Record<string, unknown>;

export interface AddressChipsCellProps {
  /** One address or the full address list from a record. */
  value?: unknown;
  addresses?: readonly unknown[] | null;
  emptyText?: string;
  testId?: string;
  className?: string;
}

const toRecord = (value: unknown): AddressRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as AddressRecord
    : null;

const readText = (record: AddressRecord, fields: readonly string[]): string => {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const getAddressRecords = (value: unknown): AddressRecord[] => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map(toRecord).filter((address): address is AddressRecord => address != null);
};

interface AddressChipProps {
  address: AddressRecord;
  index: number;
  testId: string;
}

function AddressChip({ address, index, testId }: Readonly<AddressChipProps>): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const parts = getAddressParts(address);
  const nickname = readText(address, ["nickname", "addressNickname", "addressName", "label"]);
  const type = readText(address, ["addressType", "type"]);
  const label = nickname || type || `Address ${index + 1}`;
  const city = readText(address, ["city"]);
  const state = readText(address, ["state"]);
  const postal = readText(address, ["postalCode", "zipCode"]);
  const citySummary = [city, [state, postal].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const country = readText(address, ["country"]);
  const isPrimary = address.isPrimary === true;
  const streetLines = [
    readText(address, ["streetAddress", "street1"]),
    readText(address, ["streetAddress2", "street2"]),
    readText(address, ["streetAddress3", "street3"]),
  ].filter(Boolean);
  const primaryId = String(address.addressId ?? address.id ?? index);
  const open = anchorEl != null;
  const popoverTitle = nickname || (type ? `${type} address` : `Address ${index + 1}`);
  const popoverAddress: AddressCardData = {
    id: primaryId,
    type,
    nickname,
    primary: isPrimary,
    recipient: parts.name,
    streetAddress: streetLines[0],
    streetAddress2: streetLines[1],
    streetAddress3: streetLines[2],
    city,
    state,
    postalCode: postal,
    country,
    email: parts.email,
    phone: parts.phone,
  };

  return (
    <>
      <button
        type="button"
        className={styles.addressChip}
        data-test-id={`${testId}-${primaryId}`}
        aria-label={`${label}${citySummary ? `, ${citySummary}` : ""}. Show full address`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
      >
        <span className={styles.addressChipType}>{label}</span>
        {citySummary ? <span className={styles.addressChipLocation}>{citySummary}</span> : null}
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        classes={{ paper: styles.addressPopover }}
      >
        <AddressPopoverCard address={popoverAddress} title={popoverTitle} />
      </Popover>
    </>
  );
}

/** Renders every address as a compact chip; clicking one reveals its full details. */
export default function AddressChipsCell({
  value,
  addresses,
  emptyText = "—",
  testId = "address-chips-cell",
  className,
}: Readonly<AddressChipsCellProps>): ReactElement {
  const records = getAddressRecords(value ?? addresses);
  if (records.length === 0) {
    return <span className={styles.emptyValue} data-test-id={testId}>{emptyText}</span>;
  }

  const orderedAddresses = records
    .map((address, index) => ({ address, index }))
    .sort((left, right) => Number(right.address.isPrimary === true) - Number(left.address.isPrimary === true));

  return (
    <div className={`${styles.addressChipList} ${className ?? ""}`.trim()} data-test-id={testId}>
      {orderedAddresses.map(({ address, index }) => (
        <AddressChip
          key={String(address.addressId ?? address.id ?? `address-${index}`)}
          address={address}
          index={index}
          testId={testId}
        />
      ))}
    </div>
  );
}
