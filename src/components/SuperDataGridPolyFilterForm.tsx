import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  FieldType,
  PolyForm,
  type FieldConfig,
  type FormCardConfig,
} from "@simplishelf/polyform";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Path,
} from "react-hook-form";
import {
  GridLogicOperator,
  type GridFilterItem,
  type GridFilterModel,
} from "@mui/x-data-grid";
import type { SuperDataGridFilterField } from "../utils/filterFields";
import styles from "../styles/filter-form.module.css";
import { createUniqueId } from "../utils/uniqueId";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface FilterFormValues {
  conditions: FilterCondition[];
}

interface SuperDataGridPolyFilterFormProps {
  columns: SuperDataGridFilterField[];
  initialModel: GridFilterModel;
  resetKey?: string | number | boolean;
  onChange: (model: GridFilterModel) => void;
  title?: string;
  addButtonLabel: string;
  emptyMessage?: string;
  startWithBlankCondition?: boolean;
  keepOneCondition?: boolean;
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
const BOOLEAN_VALUES = [
  { value: "true", label: "True" },
  { value: "false", label: "False" },
];

function operatorsFor(column?: SuperDataGridFilterField) {
  if (column?.type === "number") return NUMBER_OPERATORS;
  if (column?.type === "boolean") return BOOLEAN_OPERATORS;
  if (column?.type === "date" || column?.type === "dateTime") {
    return DATE_OPERATORS;
  }
  return TEXT_OPERATORS;
}

function needsValue(operator: string): boolean {
  return operator !== "isEmpty" && operator !== "isNotEmpty";
}

function valueToDraft(value: GridFilterItem["value"]): string {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }
  if (Array.isArray(value)) return value.join(";");
  return value == null ? "" : String(value);
}

function makeEmptyCondition(): FilterCondition {
  return {
    id: createUniqueId("filter"),
    field: "",
    operator: "",
    value: "",
  };
}

function modelToConditions(model: GridFilterModel): FilterCondition[] {
  return model.items.map((item, index) => ({
    id: String(item.id ?? `filter-${index}`),
    field: item.field ?? "",
    operator: item.operator ?? "",
    value: valueToDraft(item.value),
  }));
}

function toFilterModel(
  conditions: FilterCondition[],
  columns: SuperDataGridFilterField[],
  logicOperator: GridLogicOperator,
): GridFilterModel {
  const items: GridFilterItem[] = conditions
    .filter(
      (condition) =>
        condition.field !== "" &&
        condition.operator !== "" &&
        (!needsValue(condition.operator) || condition.value.trim() !== ""),
    )
    .map((condition) => {
      const column = columns.find((item) => item.field === condition.field);
      let value: unknown = condition.value;

      if (condition.operator === "isAnyOf") {
        value = condition.value
          .split(";")
          .map((entry) => entry.trim())
          .filter(Boolean);
      } else if (column?.type === "number" && needsValue(condition.operator)) {
        value = Number(condition.value);
      } else if (column?.type === "boolean") {
        value = condition.value === "true";
      } else if (
        (column?.type === "date" || column?.type === "dateTime") &&
        needsValue(condition.operator)
      ) {
        value = new Date(`${condition.value}T00:00:00`);
      }

      return {
        id: condition.id,
        field: condition.field,
        operator: condition.operator,
        value,
      };
    });

  return { items, logicOperator };
}

function makeDefaults(
  model: GridFilterModel,
  startWithBlankCondition: boolean,
): FilterFormValues {
  const conditions = modelToConditions(model);
  if (conditions.length === 0 && startWithBlankCondition) {
    conditions.push(makeEmptyCondition());
  }
  return { conditions };
}

function getPath(index: number, key: keyof FilterCondition): Path<FilterFormValues> {
  return `conditions.${index}.${key}` as Path<FilterFormValues>;
}

export default function SuperDataGridPolyFilterForm({
  columns,
  initialModel,
  resetKey,
  onChange,
  title,
  addButtonLabel,
  emptyMessage,
  startWithBlankCondition = false,
  keepOneCondition = false,
}: Readonly<SuperDataGridPolyFilterFormProps>) {
  const { control, reset, setValue } = useForm<FilterFormValues>({
    defaultValues: makeDefaults(initialModel, startWithBlankCondition),
  });
  const { append, fields, remove } = useFieldArray({
    control,
    name: "conditions",
    keyName: "rowKey",
  });
  const currentConditions = useWatch({ control, name: "conditions" }) ?? [];
  const [logicOperator, setLogicOperator] = useState<GridLogicOperator>(
    initialModel.logicOperator === GridLogicOperator.Or
      ? GridLogicOperator.Or
      : GridLogicOperator.And,
  );

  useEffect(() => {
    reset(makeDefaults(initialModel, startWithBlankCondition));
    setLogicOperator(
      initialModel.logicOperator === GridLogicOperator.Or
        ? GridLogicOperator.Or
        : GridLogicOperator.And,
    );
  }, [initialModel, reset, resetKey, startWithBlankCondition]);

  useEffect(() => {
    onChange(toFilterModel(currentConditions, columns, logicOperator));
  }, [columns, currentConditions, logicOperator, onChange]);

  const cards = useMemo<FormCardConfig<FilterFormValues>[]>(
    () =>
      fields.map((field, index) => {
        const condition = currentConditions[index] ?? field;
        const selectedColumn = columns.find(
          (column) => column.field === condition.field,
        );
        const selectedOperators = operatorsFor(selectedColumn);
        const fieldPath = getPath(index, "field");
        const operatorPath = getPath(index, "operator");
        const valuePath = getPath(index, "value");
        const showValue = needsValue(condition.operator);
        const valueType =
          selectedColumn?.type === "boolean"
            ? FieldType.Select
            : selectedColumn?.type === "date" ||
                selectedColumn?.type === "dateTime"
              ? FieldType.Date
              : FieldType.Text;
        const valueField: FieldConfig<FilterFormValues> = showValue
          ? {
              name: valuePath,
              label: "Value",
              type: valueType,
              variant: "outlined",
              disabled: !condition.field || !condition.operator,
              gridSize: { xs: 12, sm: 4 },
              placeholder:
                condition.operator === "isAnyOf"
                  ? "Separate values with ;"
                  : selectedColumn?.type === "boolean"
                    ? "Choose a value"
                    : "Enter a value",
              options: valueType === FieldType.Select ? BOOLEAN_VALUES : undefined,
            }
          : {
              name: valuePath,
              label: "Value",
              type: FieldType.Text,
              gridSize: { xs: 12, sm: 4 },
              customContent: () => (
                <div className={styles.noValue}>No value required</div>
              ),
            };

        const fields: FieldConfig<FilterFormValues>[] = [
          {
            name: fieldPath,
            label: "Column",
            type: FieldType.Select,
            variant: "outlined",
            gridSize: { xs: 12, sm: 4 },
            placeholder: "Choose a column",
            options: columns.map((column) => ({
              value: column.field,
              label: column.headerName,
            })),
            modifyFieldProps: (fieldProps) => ({
              ...fieldProps,
              onChange: (event) => {
                fieldProps.onChange(event);
                setValue(operatorPath, "");
                setValue(valuePath, "");
              },
            }),
          },
          {
            name: operatorPath,
            label: "Operator",
            type: FieldType.Select,
            variant: "outlined",
            disabled: !condition.field,
            gridSize: { xs: 12, sm: 4 },
            placeholder: "Choose an operator",
            options: selectedOperators,
            modifyFieldProps: (fieldProps) => ({
              ...fieldProps,
              onChange: (event) => {
                fieldProps.onChange(event);
                setValue(valuePath, "");
              },
            }),
          },
          valueField,
        ];

        return {
          id: field.rowKey,
          className: styles.conditionCard,
          sections: [
            {
              title: `Condition ${index + 1}`,
              className: styles.conditionSection,
              titleClassName: styles.conditionTitle,
              dividerClassName: styles.conditionDivider,
              dividerSpacerClassName: styles.conditionDividerSpacer,
              headerAction: (
                <IconButton
                  aria-label={`Remove condition ${index + 1}`}
                  className={styles.removeConditionButton}
                  data-testid={`remove-filter-condition-${index + 1}`}
                  disabled={keepOneCondition && fields.length === 1}
                  size="small"
                  onClick={() => remove(index)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              ),
              fields,
            },
          ],
        };
      }),
    [columns, currentConditions, fields, keepOneCondition, remove, setValue],
  );

  return (
    <section className={styles.builder} aria-label="Filter conditions">
      {(title || fields.length > 1) && (
        <div className={styles.builderHeader}>
          {title && <Typography className={styles.builderTitle}>{title}</Typography>}
          {fields.length > 1 && (
            <div className={styles.matchRow}>
              <span>Match</span>
              <ToggleButtonGroup
                value={logicOperator}
                exclusive
                size="small"
                aria-label="How filter conditions are combined"
                onChange={(_, value: GridLogicOperator | null) => {
                  if (value != null) setLogicOperator(value);
                }}
              >
                <ToggleButton value={GridLogicOperator.And}>All (AND)</ToggleButton>
                <ToggleButton value={GridLogicOperator.Or}>Any (OR)</ToggleButton>
              </ToggleButtonGroup>
            </div>
          )}
          {title && (
            <Button
              className={styles.addConditionButton}
              data-testid="add-filter-condition"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => append(makeEmptyCondition())}
            >
              {addButtonLabel}
            </Button>
          )}
        </div>
      )}

      {fields.length === 0 && emptyMessage && (
        <Typography className={styles.emptyState}>{emptyMessage}</Typography>
      )}

      {fields.length > 0 && (
        <PolyForm
          cards={cards}
          control={control}
          setValue={setValue}
          classNames={{
            root: styles.polyFormRoot,
            card: styles.polyFormCard,
            section: styles.polyFormSection,
            fieldGridItem: styles.polyFormField,
          }}
        />
      )}

      {!title && (
        <Button
          className={styles.addFilterButton}
          data-testid="add-filter-condition"
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={() => append(makeEmptyCondition())}
        >
          {addButtonLabel}
        </Button>
      )}
    </section>
  );
}
