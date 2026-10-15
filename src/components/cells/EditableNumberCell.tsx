import React from "react";
import { useEffect, useState, type ChangeEvent } from "react";
import type { SuperDataGridEditableNumberOptions } from "../../types";
import styles from "../../styles/predefined-cells.module.css";

interface EditableNumberCellProps {
  value: unknown;
  row: Readonly<Record<string, unknown>>;
  options?: SuperDataGridEditableNumberOptions;
}

export default function EditableNumberCell({
  value,
  row,
  options = {},
}: Readonly<EditableNumberCellProps>) {
  const isEmpty = value == null || value === "";
  const minimum = options.min ?? 1;
  const [draft, setDraft] = useState(isEmpty ? "" : String(value));

  useEffect(() => {
    setDraft(isEmpty ? "" : String(value));
  }, [isEmpty, value]);

  if (isEmpty && !options.showWhenEmpty) return <span className={styles.emptyValue}>—</span>;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };
  const commit = () => {
    const numeric = Number.parseInt(draft, 10);
    const normalized = Number.isFinite(numeric) ? Math.max(minimum, numeric) : minimum;
    setDraft(String(normalized));
    options.onChange?.(normalized, row);
  };

  return (
    <input
      aria-label="Quantity"
      className={styles.editableNumberInput}
      min={minimum}
      onBlur={commit}
      onChange={handleChange}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      placeholder={options.placeholder ?? String(minimum)}
      type="number"
      value={draft}
    />
  );
}
