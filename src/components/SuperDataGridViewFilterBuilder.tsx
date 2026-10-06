import React from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  GridLogicOperator,
  type GridFilterItem,
  type GridFilterModel,
} from "@mui/x-data-grid";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import styles from "../styles/view-filter-builder.module.css";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SuperDataGridViewFilterBuilderProps {
  columns: SuperDataGridFilterField[];
  initialModel: GridFilterModel;
  onChange: (model: GridFilterModel) => void;
}

const TEXT_OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "startsWith", label: "starts with" },
  { value: "endsWith", label: "ends with" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "isAnyOf", label: "is one of" },
];
const NUMBER_OPERATORS = [
  { value: "=", label: "equals" },
  { value: "!=", label: "does not equal" },
  { value: ">", label: "greater than" },
  { value: ">=", label: "at least" },
  { value: "<", label: "less than" },
  { value: "<=", label: "at most" },
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

function needsValue(operator: string): boolean {
  return operator !== "isEmpty" && operator !== "isNotEmpty";
}

function operatorsFor(column?: SuperDataGridFilterField) {
  if (column?.type === "number") return NUMBER_OPERATORS;
  if (column?.type === "boolean") return BOOLEAN_OPERATORS;
  if (column?.type === "date" || column?.type === "dateTime") {
    return DATE_OPERATORS;
  }
  return TEXT_OPERATORS;
}

function valueToDraft(value: GridFilterItem["value"]): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.join(";");
  return value == null ? "" : String(value);
}

function createCondition(): FilterCondition {
  return {
    id: `view-filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    field: "",
    operator: "",
    value: "",
  };
}

function modelToConditions(model: GridFilterModel): FilterCondition[] {
  return model.items.map((item, index) => ({
    id: String(item.id ?? `view-filter-${index}`),
    field: item.field ?? "",
    operator: item.operator ?? "",
    value: valueToDraft(item.value),
  }));
}

function toFilterModel(
  filters: FilterCondition[],
  columns: SuperDataGridFilterField[],
  logicOperator: GridLogicOperator,
): GridFilterModel {
  const items: GridFilterItem[] = filters
    .filter(
      (filter) =>
        filter.field !== "" &&
        filter.operator !== "" &&
        (!needsValue(filter.operator) || filter.value !== ""),
    )
    .map((filter) => {
      const column = columns.find((item) => item.field === filter.field);
      let value: unknown = filter.value;

      if (filter.operator === "isAnyOf") {
        value = filter.value
          .split(";")
          .map((entry) => entry.trim())
          .filter(Boolean);
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
        field: filter.field,
        operator: filter.operator,
        value,
      };
    });

  return { items, logicOperator };
}

export default function SuperDataGridViewFilterBuilder({
  columns,
  initialModel,
  onChange,
}: SuperDataGridViewFilterBuilderProps) {
  const filterableColumns = React.useMemo(
    () => columns.filter((column) => column.filterable !== false),
    [columns],
  );
  const [filters, setFilters] = React.useState<FilterCondition[]>(() =>
    modelToConditions(initialModel),
  );
  const [logicOperator, setLogicOperator] = React.useState<GridLogicOperator>(
    initialModel.logicOperator === GridLogicOperator.Or
      ? GridLogicOperator.Or
      : GridLogicOperator.And,
  );

  React.useEffect(() => {
    onChange(toFilterModel(filters, filterableColumns, logicOperator));
  }, [filterableColumns, filters, logicOperator, onChange]);

  const updateCondition = (
    id: string,
    key: keyof FilterCondition,
    value: string,
  ) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id !== id) return filter;
        if (key === "field") {
          return { ...filter, field: value, operator: "", value: "" };
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

  return (
    <section className={styles.builder} aria-label="Filters for this view">
      <div className={styles.builderHeader}>
        <div>
          <Typography className={styles.builderTitle}>View filters</Typography>
          <Typography className={styles.builderDescription}>
            These conditions belong to this view and are independent of the grid filter.
          </Typography>
        </div>
        <Button
          className={styles.addConditionButton}
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setFilters((current) => [...current, createCondition()])}
        >
          Add condition
        </Button>
      </div>

      {filters.length > 1 && (
        <Box className={styles.matchRow}>
          <span>Match</span>
          <ToggleButtonGroup
            value={logicOperator}
            exclusive
            size="small"
            aria-label="How view filter conditions are combined"
            onChange={(_, value: GridLogicOperator | null) => {
              if (value != null) setLogicOperator(value);
            }}
          >
            <ToggleButton value={GridLogicOperator.And}>All (AND)</ToggleButton>
            <ToggleButton value={GridLogicOperator.Or}>Any (OR)</ToggleButton>
          </ToggleButtonGroup>
          <span>conditions</span>
        </Box>
      )}

      {filters.length === 0 ? (
        <Typography className={styles.emptyState}>
          This view currently has no filters. Add a condition to narrow its rows.
        </Typography>
      ) : (
        <div className={styles.conditionList}>
          {filters.map((filter, index) => {
            const selectedColumn = filterableColumns.find(
              (column) => column.field === filter.field,
            );
            const operators = operatorsFor(selectedColumn);
            const showValue =
              filter.operator !== "" && needsValue(filter.operator);

            return (
              <React.Fragment key={filter.id}>
                {index > 0 && <Divider className={styles.conditionDivider} />}
                <div className={styles.conditionRow}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={filter.field}
                      label="Column"
                      onChange={(event) =>
                        updateCondition(filter.id, "field", event.target.value)
                      }
                    >
                      {filterableColumns.map((column) => (
                        <MenuItem key={column.field} value={column.field}>
                          {column.headerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" disabled={!filter.field}>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={filter.operator}
                      label="Operator"
                      onChange={(event) =>
                        updateCondition(
                          filter.id,
                          "operator",
                          event.target.value,
                        )
                      }
                    >
                      {operators.map((operator) => (
                        <MenuItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <div className={styles.valueField}>
                    {showValue && selectedColumn?.type === "boolean" ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Value</InputLabel>
                        <Select
                          value={filter.value}
                          label="Value"
                          onChange={(event) =>
                            updateCondition(
                              filter.id,
                              "value",
                              event.target.value,
                            )
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
                        value={filter.value}
                        onChange={(event) =>
                          updateCondition(
                            filter.id,
                            "value",
                            event.target.value,
                          )
                        }
                        size="small"
                        fullWidth
                        InputLabelProps={
                          selectedColumn?.type === "date" ||
                          selectedColumn?.type === "dateTime"
                            ? { shrink: true }
                            : undefined
                        }
                        placeholder={
                          filter.operator === "isAnyOf"
                            ? "Separate values with ;"
                            : undefined
                        }
                      />
                    ) : (
                      <span className={styles.noValue}>No value needed</span>
                    )}
                  </div>

                  <IconButton
                    className={styles.removeConditionButton}
                    size="small"
                    aria-label={`Remove condition ${index + 1}`}
                    onClick={() =>
                      setFilters((current) =>
                        current.filter((item) => item.id !== filter.id),
                      )
                    }
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </section>
  );
}
