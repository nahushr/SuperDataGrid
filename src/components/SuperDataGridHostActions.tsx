import React, { useState, type ReactNode } from "react";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import styles from "../styles/grid-actions.module.css";

export interface SuperDataGridHostActionsClasses {
  root?: string;
  customActions?: string;
  bulkActions?: string;
  bulkButton?: string;
}

export interface SuperDataGridHostActionsProps {
  customActions?: ReactNode;
  bulkItems?: ReactNode;
  bulkTestId?: string;
  bulkColor?: ButtonProps["color"];
  bulkLabel?: string;
  selectionCount?: number;
  className?: string;
  classes?: SuperDataGridHostActionsClasses;
}

/** Package-owned layout and styling for application-provided grid actions. */
export default function SuperDataGridHostActions({
  customActions,
  bulkItems,
  bulkTestId = "grid-toolbar",
  bulkColor = "primary",
  bulkLabel = "Bulk actions",
  selectionCount = 0,
  className,
  classes = {},
}: Readonly<SuperDataGridHostActionsProps>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (customActions == null && bulkItems == null) return null;

  return (
    <Box className={`${styles.hostActions} ${classes.root ?? ""} ${className ?? ""}`.trim()}>
      <Box className={`${styles.hostActionGroup} ${classes.customActions ?? ""}`.trim()}>
        {customActions}
      </Box>
      {bulkItems != null && (
        <Box className={`${styles.hostBulkActions} ${classes.bulkActions ?? ""}`.trim()}>
          <Tooltip
            title={selectionCount > 0
              ? `${selectionCount} selected`
              : "Select rows to see bulk actions"}
          >
            <span>
              <Badge badgeContent={selectionCount} color="secondary">
                <Button
                  size="small"
                  variant={selectionCount > 0 ? "contained" : "outlined"}
                  color={bulkColor}
                  startIcon={<PlaylistAddCheckIcon />}
                  disabled={selectionCount === 0}
                  onClick={(event) => setAnchor(event.currentTarget)}
                  data-test-id={`${bulkTestId}-bulk-actions-button`}
                  className={`${styles.bulkActionButton} ${classes.bulkButton ?? ""}`.trim()}
                >
                  {bulkLabel}
                </Button>
              </Badge>
            </span>
          </Tooltip>
          <Menu
            anchorEl={anchor}
            open={Boolean(anchor)}
            onClose={() => setAnchor(null)}
            onClick={() => setAnchor(null)}
            data-test-id={`${bulkTestId}-bulk-actions-menu`}
          >
            {bulkItems}
          </Menu>
        </Box>
      )}
    </Box>
  );
}
