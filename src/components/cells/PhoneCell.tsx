import React from "react";
import PhoneIcon from "@mui/icons-material/Phone";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import type { SuperDataGridPhoneOptions } from "../../types";
import { firstText } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface PhoneCellProps {
  value: unknown;
  options?: SuperDataGridPhoneOptions;
}

export default function PhoneCell({ value, options = {} }: PhoneCellProps) {
  const phoneText = firstText(value, ["phone", "phoneNumber", "mobile", "value"]);
  const record = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
  const explicitLabel = firstText(record, ["label", "displayName"]);
  if (!phoneText) return <span className={styles.emptyValue}>—</span>;

  let href = `tel:${phoneText}`;
  let display = phoneText;
  let flagCountryCode = record?.countryCode ?? record?.country ?? options.countryCode;
  try {
    const countryCode = options.countryCode?.toUpperCase() as CountryCode | undefined;
    const parsed = parsePhoneNumberFromString(phoneText, countryCode);
    if (parsed) {
      href = `tel:${parsed.number}`;
      flagCountryCode = parsed.country ?? flagCountryCode ?? countryCode;
      display = options.format === "original"
        ? phoneText
        : options.format === "national"
          ? parsed.formatNational()
          : parsed.formatInternational();
    }
  } catch {
    // Preserve the original value when it is not a valid phone number.
  }
  const flag = options.showFlag === false ? "" : countryFlag(flagCountryCode);

  return (
    <a
      className={styles.contactLink}
      href={href}
      onClick={(event) => event.stopPropagation()}
      title={`Call ${display}`}
    >
      {options.showIcon !== false && (
        <PhoneIcon className={styles.contactIcon} aria-hidden="true" />
      )}
      {flag && <span aria-label={`${flagCountryCode} flag`} className={styles.phoneFlag} role="img">{flag}</span>}
      <span className={styles.contactText}>{explicitLabel || display}</span>
    </a>
  );
}

function countryFlag(value: unknown): string {
  if (typeof value !== "string") return "";
  const countryCode = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return "";
  return String.fromCodePoint(
    ...[...countryCode].map((letter) => letter.charCodeAt(0) + 127397),
  );
}
