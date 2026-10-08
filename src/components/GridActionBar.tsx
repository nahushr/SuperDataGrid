import React, { type ReactNode } from "react";
import styles from "../styles/grid-actions.module.css";

export interface GridActionBarProps {
  children?: ReactNode;
  className?: string;
}

/** Flexible action layout for page-level Add, Import, and Search controls. */
export function GridActionBar({ children, className }: GridActionBarProps) {
  return (
    <div className={`${styles.actionBar} ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

export default GridActionBar;
