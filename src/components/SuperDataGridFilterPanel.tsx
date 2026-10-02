import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  GridLogicOperator,
  type GridColDef,
  type GridFilterItem,
  type GridFilterModel,
} from "@mui/x-data-grid";
import styles from "../styles/filter-panel.module.css";

interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface FilterPanelProps {
  open: boolean;
  columns: GridColDef[];
  filterModel: GridFilterModel;
  onClose: () => void;
  onApply: (model: GridFilterModel) => void;
}

const TEXT_OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "=" },
  { value: "startsWith", label: "starts with" },
  { value: "endsWith", label: "ends with" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "isAnyOf", label: "is one of" },
];
const NUMBER_OPERATORS = [
  { value: "=", label: "=" },
  { value: "!=", label: "!=" },
  { value: ">", label: ">" },
  { value: ">=", label: ">=" },
  { value: "<", label: "<" },
  { value: "<=", label: "<=" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];
const DATE_OPERATORS = [
  { value: "is", label: "is" },
  { value: "not", label: "is not" },
  { value: "after", label: "is after" },
  { value: "onOrAfter", label: "is on or after" },
  { value: "before", label: "is before" },
  { value: "onOrBefore", label: "is on or before" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];
const BOOLEAN_OPERATORS = [{ value: "is", label: "is" }];

function operatorsFor(column?: GridColDef) {
  if (column?.type === "number") return NUMBER_OPERATORS;
  if (column?.type === "boolean") return BOOLEAN_OPERATORS;
  if (column?.type === "date" || column?.type === "dateTime") {
    return DATE_OPERATORS;
  }
  return TEXT_OPERATORS;
}

function needsValue(operator: string) {
  return operator !== "isEmpty" && operator !== "isNotEmpty";
}

function valueToDraft(value: GridFilterItem["value"]): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.join(";");
  return value == null ? "" : String(value);
}

function itemToCondition(item: GridFilterItem, index: number): FilterCondition {
  return {
    id: String(item.id ?? `filter-${index}`),
    column: item.field ?? "",
    operator: item.operator ?? "",
    value: valueToDraft(item.value),
  };
}

function makeEmptyCondition(): FilterCondition {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    column: "",
    operator: "",
    value: "",
  };
}

export default function SuperDataGridFilterPanel({
  open,
  columns,
  filterModel,
  onClose,
  onApply,
}: FilterPanelProps) {
  const [logicOperator, setLogicOperator] = React.useState<"and" | "or">(
    filterModel.logicOperator === GridLogicOperator.Or ? "or" : "and",
  );
  const [filters, setFilters] = React.useState<FilterCondition[]>([
    makeEmptyCondition(),
  ]);

  React.useEffect(() => {
    setLogicOperator(
      filterModel.logicOperator === GridLogicOperator.Or ? "or" : "and",
    );
    setFilters(
      filterModel.items.length > 0
        ? filterModel.items.map(itemToCondition)
        : [makeEmptyCondition()],
    );
  }, [filterModel, open]);

  const updateFilter = (
    id: string,
    key: keyof FilterCondition,
    value: string,
  ) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id !== id) return filter;
        if (key === "column") {
          return { ...filter, column: value, operator: "", value: "" };
        }
        if (key === "operator") {
          return {
            ...filter,
            operator: value,
            value: needsValue(value) ? filter.value : "",
          };
        }
        return { ...filter, [key]: value };
      }),
    );
  };

  const applyFilters = () => {
    const validFilters = filters.filter(
      (filter) =>
        filter.column !== "" &&
        filter.operator !== "" &&
        (!needsValue(filter.operator) || filter.value !== ""),
    );
    const items: GridFilterItem[] = validFilters.map((filter) => {
      const column = columns.find((item) => item.field === filter.column);
      let value: unknown = filter.value;

      if (filter.operator === "isAnyOf") {
        value = filter.value.split(";").map((entry) => entry.trim());
      } else if (column?.type === "number" && needsValue(filter.operator)) {
        value = Number(filter.value);
      } else if (column?.type === "boolean") {
        value = filter.value === "true";
      } else if (
        (column?.type === "date" || column?.type === "dateTime") &&
        needsValue(filter.operator)
      ) {
        value = new Date(`${filter.value}T00:00:00`);
      }

      return {
        id: filter.id,
        field: filter.column,
        operator: filter.operator,
        value,
      };
    });

    onApply({
      items,
      logicOperator:
        logicOperator === "or" ? GridLogicOperator.Or : GridLogicOperator.And,
    });
    onClose();
  };

  const removeAll = () => {
    setFilters([makeEmptyCondition()]);
    setLogicOperator("and");
    onApply({ items: [], logicOperator: GridLogicOperator.And });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: styles.paper }}
    >
      <DialogTitle className={styles.title}>
        Filter Data
        <IconButton onClick={onClose} size="small" aria-label="Close filter dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent className={styles.content}>
        {filters.length > 1 && (
          <Box className={styles.matchRow}>
            <span>Match:</span>
            <ToggleButtonGroup
              value={logicOperator}
              exclusive
              size="small"
              onChange={(_, value: "and" | "or" | null) => {
                if (value != null) setLogicOperator(value);
              }}
            >
              <ToggleButton value="and">All (AND)</ToggleButton>
              <ToggleButton value="or">Any (OR)</ToggleButton>
            </ToggleButtonGroup>
            <span>of the following conditions:</span>
          </Box>
        )}

        {filters.map((filter, index) => {
          const selectedColumn = columns.find(
            (column) => column.field === filter.column,
          );
          const operators = operatorsFor(selectedColumn);
          const showValue =
            filter.operator !== "" && needsValue(filter.operator);

          return (
            <React.Fragment key={filter.id}>
              {index > 0 && (
                <Box className={styles.conditionDivider}>
                  <Divider className={styles.dividerLine} />
                  <Chip
                    label={logicOperator.toUpperCase()}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Divider className={styles.dividerLine} />
                </Box>
              )}
              <Box className={styles.conditionRow}>
                <FormControl fullWidth size="small">
                  <InputLabel>Column</InputLabel>
                  <Select
                    value={filter.column}
                    label="Column"
                    onChange={(event) =>
                      updateFilter(filter.id, "column", event.target.value)
                    }
                  >
                    {columns.map((column) => (
                      <MenuItem key={column.field} value={column.field}>
                        {column.headerName ?? column.field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" disabled={!filter.column}>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={filter.operator}
                    label="Operator"
                    onChange={(event) =>
                      updateFilter(filter.id, "operator", event.target.value)
                    }
                  >
                    {operators.map((operator) => (
                      <MenuItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box className={styles.valueField}>
                  {showValue && selectedColumn?.type === "boolean" ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Value</InputLabel>
                      <Select
                        value={filter.value}
                        label="Value"
                        onChange={(event) =>
                          updateFilter(filter.id, "value", event.target.value)
                        }
                      >
                        <MenuItem value="true">True</MenuItem>
                        <MenuItem value="false">False</MenuItem>
                      </Select>
                    </FormControl>
                  ) : showValue ? (
                    <TextField
                      label="Value"
                      type={
                        selectedColumn?.type === "number"
                          ? "number"
                          : selectedColumn?.type === "date" ||
                              selectedColumn?.type === "dateTime"
                            ? "date"
                            : "text"
                      }
                      size="small"
                      fullWidth
                      value={filter.value}
                      placeholder={
                        filter.operator === "isAnyOf"
                          ? "Value1;Value2;Value3"
                          : "Filter value"
                      }
                      onChange={(event) =>
                        updateFilter(filter.id, "value", event.target.value)
                      }
                      helperText={
                        filter.operator === "isAnyOf"
                          ? "Use semicolon (;) to separate multiple values"
                          : undefined
                      }
                      InputLabelProps={
                        selectedColumn?.type === "date" ||
                        selectedColumn?.type === "dateTime"
                          ? { shrink: true }
                          : undefined
                      }
                    />
                  ) : null}
                </Box>

                <IconButton
                  aria-label={`Remove filter ${index + 1}`}
                  color="error"
                  size="small"
                  disabled={filters.length === 1}
                  onClick={() =>
                    setFilters((current) =>
                      current.filter((item) => item.id !== filter.id),
                    )
                  }
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            </React.Fragment>
          );
        })}

        <Button
          startIcon={<AddIcon />}
          onClick={() => setFilters((current) => [...current, makeEmptyCondition()])}
          variant="outlined"
          className={`${styles.addFilterButton} ${styles.actionButton}`}
        >
          Add Filter
        </Button>
      </DialogContent>
      <Divider />
      <DialogActions className={styles.actions}>
        <Button
          onClick={removeAll}
          variant="outlined"
          color="secondary"
          className={styles.actionButton}
        >
          Remove All
        </Button>
        <Box className={styles.actionsSpacer} />
        <Button
          onClick={onClose}
          variant="outlined"
          className={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          onClick={applyFilters}
          variant="contained"
          className={styles.actionButton}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}
