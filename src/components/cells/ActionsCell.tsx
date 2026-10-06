import React from "react";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Button from "@mui/material/Button";
import type { ReactNode } from "react";
import {
  SUPER_DATA_GRID_ACTIONS,
  type SuperDataGridActionType,
} from "../../types";
import styles from "../../styles/actions-cell.module.css";

interface ActionDefinition {
  label: string;
  icon: ReactNode;
  destructive?: boolean;
}

const ACTION_DEFINITIONS: Record<SuperDataGridActionType, ActionDefinition> = {
  [SUPER_DATA_GRID_ACTIONS.VIEW]: {
    label: "View",
    icon: <VisibilityOutlinedIcon fontSize="small" />,
  },
  [SUPER_DATA_GRID_ACTIONS.EDIT]: {
    label: "Edit",
    icon: <EditOutlinedIcon fontSize="small" />,
  },
  [SUPER_DATA_GRID_ACTIONS.DEACTIVATE]: {
    label: "Deactivate",
    icon: <BlockOutlinedIcon fontSize="small" />,
    destructive: true,
  },
  [SUPER_DATA_GRID_ACTIONS.SHARE]: {
    label: "Share",
    icon: <ShareOutlinedIcon fontSize="small" />,
  },
};

const VALID_ACTIONS = new Set<string>(Object.keys(ACTION_DEFINITIONS));

function isAction(value: unknown): value is SuperDataGridActionType {
  return typeof value === "string" && VALID_ACTIONS.has(value);
}

interface ActionsCellProps {
  value: unknown;
  onAction?: (action: SuperDataGridActionType) => void;
}

export default function ActionsCell({ value, onAction }: Readonly<ActionsCellProps>) {
  const actions = Array.isArray(value) ? value.filter(isAction) : [];

  if (actions.length === 0) {
    return <span className={styles.emptyValue}>—</span>;
  }

  return (
    <div className={styles.actionsCell}>
      {actions.map((action, index) => {
        const definition = ACTION_DEFINITIONS[action];

        return (
          <Button
            key={`${action}-${index}`}
            className={`${styles.actionButton} ${definition.destructive ? styles.destructiveAction : ""}`.trim()}
            color={definition.destructive ? "error" : "primary"}
            variant="text"
            size="small"
            startIcon={definition.icon}
            aria-label={definition.label}
            onClick={(event) => {
              event.stopPropagation();
              onAction?.(action);
            }}
          >
            {definition.label}
          </Button>
        );
      })}
    </div>
  );
}
