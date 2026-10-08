import React, { type ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import styles from "../styles/grid-actions.module.css";

export type GridActionAppearance = "primary" | "secondary" | "utility";

export interface GridActionButtonProps extends Omit<ButtonProps, "color"> {
  appearance?: GridActionAppearance;
  startIcon?: ReactNode;
}

/** A ready-styled grid action button. Pass className or sx to override it. */
export function GridActionButton({
  appearance = "secondary",
  className,
  startIcon,
  children,
  ...buttonProps
}: GridActionButtonProps) {
  const appearanceClass = appearance === "primary"
    ? styles.primaryAction
    : appearance === "utility"
      ? styles.utilityAction
      : styles.secondaryAction;
  return (
    <Button
      {...buttonProps}
      color="inherit"
      startIcon={startIcon}
      className={`${styles.actionButton} ${appearanceClass} ${className ?? ""}`.trim()}
    >
      {children}
    </Button>
  );
}

export default GridActionButton;
