import React, { type ReactNode } from "react";
import styles from "../styles/grid-actions.module.css";

export interface GridActionBarProps {
  children?: ReactNode;
  className?: string;
  /** Adds a self-contained midnight-teal surface behind the action group. */
  surface?: "default" | "dark";
}

/** Flexible action layout for page-level Add, Import, and Search controls. */
export function GridActionBar({
  children,
  className,
  surface = "default",
}: GridActionBarProps) {
  const surfaceClass = surface === "dark" ? styles.darkActionBar : "";
  return (
    <div className={`${styles.actionBar} ${surfaceClass} ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

export default GridActionBar;
