import { Chip } from "@mui/material";
import type { SuperDataGridCellProps } from "@simplishelf/super-data-grid";
import type { DemoUser } from "../mockServer";
import styles from "./role-cell.module.css";

export default function RoleCell({ value }: SuperDataGridCellProps<DemoUser>) {
  const isAdmin = value === "Admin";
  return (
    <Chip
      size="small"
      color={isAdmin ? "primary" : "default"}
      label={String(value ?? "")}
      className={styles.roleChip}
    />
  );
}
