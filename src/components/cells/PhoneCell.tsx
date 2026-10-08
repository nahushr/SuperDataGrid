import React from "react";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import type { SuperDataGridPhoneOptions } from "../../types";
import { formatMaskedPhoneNumber } from "../../utils/commonCellData";
import { firstText } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

export interface PhoneCellProps {
  value: unknown;
  options?: SuperDataGridPhoneOptions;
  customFormatter?: (phone: string) => string;
  emptyText?: string;
  clickable?: boolean;
  wrap?: boolean;
  showIcon?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function PhoneCell({
  value,
  options = {},
  customFormatter,
  emptyText = "—",
  clickable = true,
  wrap = false,
  showIcon = options.showIcon !== false,
  className,
  iconClassName,
  textClassName,
}: Readonly<PhoneCellProps>) {
  const phoneText = firstText(value, ["phone", "phoneNumber", "mobile", "value"]);
  const record = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
  const explicitLabel = firstText(record, ["label", "displayName"]);
  if (!phoneText) return <span className={`${styles.emptyValue} ${className ?? ""}`.trim()}>{emptyText}</span>;

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
  if (customFormatter) display = customFormatter(phoneText);
  const flag = options.showFlag === false ? "" : countryFlag(flagCountryCode);

  const content = (
    <>
      {showIcon && <PhoneOutlinedIcon className={`${styles.contactIcon} ${iconClassName ?? ""}`.trim()} aria-hidden="true" />}
      {flag && <span aria-label={`${flagCountryCode.toUpperCase()} flag`} className={styles.phoneFlag} role="img">{flag}</span>}
      <span className={`${styles.phoneContactText} ${wrap ? styles.contactTextWrap : ""} ${textClassName ?? ""}`.trim()}>{explicitLabel || display}</span>
    </>
  );
  const rootClassName = `${styles.contactLink} ${styles.phoneContactLink} ${wrap ? styles.phoneContactLinkWrap : ""} ${className ?? ""}`.trim();
  return clickable
    ? <a className={rootClassName} href={href} onClick={(event) => event.stopPropagation()} title={`Call ${display}`}>{content}</a>
    : <span className={rootClassName}>{content}</span>;
}

function countryFlag(value: unknown): string {
  if (typeof value !== "string") return "";
  const countryCode = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return "";
  return String.fromCodePoint(
    ...[...countryCode].map((letter) => (letter.codePointAt(0) ?? 0) + 127397),
  );
}
