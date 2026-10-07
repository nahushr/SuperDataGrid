import React from "react";
import PhoneIcon from "@mui/icons-material/Phone";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import type { SuperDataGridPhoneOptions } from "../../types";
import { formatMaskedPhoneNumber } from "../../utils/commonCellData";
import { firstText } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface PhoneCellProps {
  value: unknown;
  options?: SuperDataGridPhoneOptions;
}

export default function PhoneCell({ value, options = {} }: Readonly<PhoneCellProps>) {
  const phoneText = firstText(value, ["phone", "phoneNumber", "mobile", "value"]);
  const record = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
  const explicitLabel = firstText(record, ["label", "displayName"]);
  if (!phoneText) return <span className={styles.emptyValue}>—</span>;

  let href = `tel:${phoneText}`;
  let display = phoneText;
  const initialFlagCountryCode = record?.countryCode ?? record?.country ?? options.countryCode;
  let flagCountryCode = typeof initialFlagCountryCode === "string" ? initialFlagCountryCode : "";
  try {
    const countryCode = options.countryCode?.toUpperCase() as CountryCode | undefined;
    const parsed = parsePhoneNumberFromString(phoneText, countryCode);
    if (parsed) {
      href = `tel:${parsed.number}`;
      flagCountryCode = parsed.country ?? flagCountryCode ?? countryCode ?? "";
      if (options.format === "original") {
        display = phoneText;
      } else if (options.format === "national") {
        display = formatMaskedPhoneNumber(parsed.nationalNumber) ?? parsed.formatNational();
      } else {
        const maskedNationalNumber = formatMaskedPhoneNumber(parsed.nationalNumber);
        display = maskedNationalNumber
          ? `+${parsed.countryCallingCode} ${maskedNationalNumber}`
          : parsed.formatInternational();
      }
    }
  } catch {
    // Preserve the original value when it is not a valid phone number.
  }
  const flag = options.showFlag === false ? "" : countryFlag(flagCountryCode);

  return (
    <a
      className={`${styles.contactLink} ${styles.phoneContactLink}`}
      href={href}
      onClick={(event) => event.stopPropagation()}
      title={`Call ${display}`}
    >
      {options.showIcon !== false && (
        <PhoneIcon className={styles.contactIcon} aria-hidden="true" />
      )}
      {flag && <span aria-label={`${flagCountryCode.toUpperCase()} flag`} className={styles.phoneFlag} role="img">{flag}</span>}
      <span className={styles.phoneContactText}>{explicitLabel || display}</span>
    </a>
  );
}

function countryFlag(value: unknown): string {
  if (typeof value !== "string") return "";
  const countryCode = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return "";
  return String.fromCodePoint(
    ...[...countryCode].map((letter) => (letter.codePointAt(0) ?? 0) + 127397),
  );
}
