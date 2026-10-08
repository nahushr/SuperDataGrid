import React, { type MouseEvent, type ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import styles from "../styles/actions-cell.module.css";

export interface GridActionDefinition {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  color?: ButtonProps["color"];
  dataTestId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  tooltip?: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export interface GridActionsCellClasses {
  root?: string;
  button?: string;
  destructiveButton?: string;
  wrapper?: string;
}

export interface GridActionsCellProps {
  actions: GridActionDefinition[];
  emptyText?: string;
  /** Render the actions in a compact inline row instead of a two-column grid. */
  layout?: "grid" | "inline";
  className?: string;
  classes?: GridActionsCellClasses;
}

/**
 * Shared row-action cell. Its default spacing and colors travel with the
 * package; consumers can override the root or individual parts with classes.
 */
export function GridActionsCell({
  actions,
  emptyText = "—",
  layout = "grid",
  className,
  classes = {},
}: Readonly<GridActionsCellProps>) {
  if (actions.length === 0) {
    return <span className={styles.emptyValue}>{emptyText}</span>;
  }

  const rootClassName = layout === "inline"
    ? styles.actionsCellInline
    : styles.actionsCell;

  return (
    <Box className={`${rootClassName} ${classes.root ?? ""} ${className ?? ""}`.trim()}>
      {actions.map((action) => {
        const isDestructive = action.color === "error" ||
          /(deactivate|delete|cancel)/i.test(`${action.key} ${action.label}`);
        const button = (
          <Button
            href={action.href}
            color={action.color ?? "inherit"}
            variant="text"
            size="small"
            disabled={action.disabled}
            data-test-id={action.dataTestId}
            data-testid={action.dataTestId}
            aria-label={action.ariaLabel ?? action.label}
            startIcon={action.icon}
            onClick={(event) => {
              event.stopPropagation();
              if (action.href === "#") event.preventDefault();
              action.onClick?.(event);
            }}
            className={`${styles.actionButton} ${isDestructive ? styles.destructiveAction : ""} ${classes.button ?? ""} ${isDestructive ? classes.destructiveButton ?? "" : ""} ${action.className ?? ""}`.trim()}
          >
            {action.label}
          </Button>
        );

        const wrappedButton = (
          <Box
            key={action.key}
            component="span"
            className={`${styles.actionWrapper} ${classes.wrapper ?? ""}`.trim()}
          >
            {button}
          </Box>
        );

        return action.tooltip
          ? <Tooltip key={action.key} title={action.tooltip} arrow>{wrappedButton}</Tooltip>
          : wrappedButton;
      })}
    </Box>
  );
}

export default GridActionsCell;
