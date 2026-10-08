import React from "react";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { GridActionsCell, type GridActionDefinition } from "../GridActionsCell";
import {
  SUPER_DATA_GRID_ACTIONS,
  type SuperDataGridActionType,
} from "../../types";

interface ActionDefinition {
  label: string;
  icon: JSX.Element;
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
  const actionDefinitions: GridActionDefinition[] = actions.map((action, index) => {
    const definition = ACTION_DEFINITIONS[action];
    return {
      key: `${action}-${index}`,
      label: definition.label,
      icon: definition.icon,
      color: definition.destructive ? "error" : "inherit",
      onClick: () => onAction?.(action),
    };
  });
  return <GridActionsCell actions={actionDefinitions} emptyText="—" />;
}
