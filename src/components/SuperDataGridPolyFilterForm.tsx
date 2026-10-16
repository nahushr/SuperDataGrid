import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  type DateTimeValue,
} from "@simplishelf/polyform";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Path,
} from "react-hook-form";
import { GridLogicOperator } from "@mui/x-data-grid";
import type {
  SuperDataGridFilterField,
  SuperDataGridFilterGroup,
  SuperDataGridFilterModel,
  SuperDataGridFilterRule,
} from "../types";
import styles from "../styles/filter-form.module.css";
import { createUniqueId } from "../utils/uniqueId";

type FilterGroupCombinator = "and" | "or";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: unknown;
}

interface ConditionReference {
  kind: "condition";
  conditionId: string;
}

interface GroupReference {
  kind: "group";
  group: FilterGroupNode;
}

type FilterGroupRule = ConditionReference | GroupReference;

interface FilterGroupNode {
  id: string;
  combinator: FilterGroupCombinator;
  rules: FilterGroupRule[];
}

interface FilterFormValues {
  conditions: FilterCondition[];
}

interface FilterFormDefaults {
  values: FilterFormValues;
  root: FilterGroupNode;
}

interface SuperDataGridPolyFilterFormProps {
  columns: SuperDataGridFilterField[];
  initialModel: SuperDataGridFilterModel;
  resetKey?: string | number | boolean;
  onChange: (model: SuperDataGridFilterModel) => void;
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
const DATE_TIME_OPERATORS = [
  { value: "is", label: "is exactly" },
  { value: "not", label: "is not exactly" },
  { value: "after", label: "is after" },
  { value: "onOrAfter", label: "is on or after" },
  { value: "before", label: "is before" },
  { value: "onOrBefore", label: "is on or before" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];
const TIME_OPERATORS = [
  { value: "timeIs", label: "is" },
  { value: "timeBefore", label: "is before" },
  { value: "timeAfter", label: "is after" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];
const LIST_OPERATORS = [
  { value: "isOneOf", label: "includes any of" },
  { value: "isNotOneOf", label: "includes none of" },
  { value: "containsOneOf", label: "contains any text" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];
const BOOLEAN_OPERATORS = [{ value: "is", label: "is" }];
const BOOLEAN_VALUES = [
  { value: "true", label: "True" },
  { value: "false", label: "False" },
];

function operatorsFor(column?: SuperDataGridFilterField) {
  if (column?.type === "list") return LIST_OPERATORS;
  if (column?.type === "number") return NUMBER_OPERATORS;
  if (column?.type === "boolean") return BOOLEAN_OPERATORS;
  if (column?.type === "date") return DATE_OPERATORS;
  if (column?.type === "dateTime") return DATE_TIME_OPERATORS;
  if (column?.type === "time") return TIME_OPERATORS;
  return TEXT_OPERATORS;
}

function needsValue(operator: string): boolean {
  return operator !== "isEmpty" && operator !== "isNotEmpty";
}

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null && "dateTime" in value) {
    return value.dateTime instanceof Date && !Number.isNaN(value.dateTime.getTime());
  }
  return false;
}

function localTimeValue(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function emptyValueForType(type?: SuperDataGridFilterField["type"]): unknown {
  return type === "dateTime" || type === "time" ? null : "";
}

function valueToDraft(value: unknown, type?: SuperDataGridFilterField["type"]): unknown {
  if (type === "dateTime") {
    const dateTime = value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
    return {
      dateTime: dateTime && !Number.isNaN(dateTime.getTime()) ? dateTime : null,
      timezone: "UTC",
    } satisfies DateTimeValue;
  }
  if (type === "time") {
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const [hours, minutes, seconds = "0"] = value.split(":");
      const date = new Date(1970, 0, 1, Number(hours), Number(minutes), Number(seconds));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
  if (value instanceof Date) {
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${value.getUTCFullYear()}-${month}-${day}`;
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

function makeEmptyGroup(): FilterGroupNode {
  return { id: createUniqueId("filter-group"), combinator: "and", rules: [] };
}

const isQueryGroup = (
  rule: SuperDataGridFilterRule | SuperDataGridFilterGroup,
): rule is SuperDataGridFilterGroup => "rules" in rule && Array.isArray(rule.rules);

function modelToDefaults(
  model: SuperDataGridFilterModel,
  columns: readonly SuperDataGridFilterField[],
  startWithBlankCondition: boolean,
): FilterFormDefaults {
  const conditions: FilterCondition[] = [];
  const root = makeEmptyGroup();

  const addRule = (
    group: FilterGroupNode,
    rule: SuperDataGridFilterRule | SuperDataGridFilterGroup,
  ): void => {
    if (isQueryGroup(rule)) {
      const nested: FilterGroupNode = {
        id: rule.id ?? createUniqueId("filter-group"),
        combinator: rule.combinator === "or" ? "or" : "and",
        rules: [],
      };
      rule.rules.forEach((child) => addRule(nested, child));
      group.rules.push({ kind: "group", group: nested });
      return;
    }

    const conditionType = columns.find((column) => column.field === rule.field)?.type;
    const condition: FilterCondition = {
      id: rule.id ?? createUniqueId("filter"),
      field: rule.field ?? "",
      operator: rule.operator ?? "",
      value: valueToDraft(rule.value, conditionType),
    };
    conditions.push(condition);
    group.rules.push({ kind: "condition", conditionId: condition.id });
  };

  if (model.filterQuery) {
    root.id = model.filterQuery.id ?? root.id;
    root.combinator = model.filterQuery.combinator === "or" ? "or" : "and";
    model.filterQuery.rules.forEach((rule) => addRule(root, rule));
  } else {
    root.combinator = model.logicOperator === GridLogicOperator.Or ? "or" : "and";
    model.items.forEach((item, index) => {
      const condition: FilterCondition = {
        id: String(item.id ?? `filter-${index}`),
        field: item.field ?? "",
        operator: item.operator ?? "",
        value: valueToDraft(
          item.value,
          columns.find((column) => column.field === item.field)?.type,
        ),
      };
      conditions.push(condition);
      root.rules.push({ kind: "condition", conditionId: condition.id });
    });
  }

  if (conditions.length === 0 && startWithBlankCondition) {
    const condition = makeEmptyCondition();
    conditions.push(condition);
    root.rules.push({ kind: "condition", conditionId: condition.id });
  }

  return { values: { conditions }, root };
}

function getPath(index: number, key: keyof FilterCondition): Path<FilterFormValues> {
  return `conditions.${index}.${key}` as Path<FilterFormValues>;
}

function conditionToRule(
  condition: FilterCondition,
  columns: readonly SuperDataGridFilterField[],
): SuperDataGridFilterRule | undefined {
  if (
    !condition.field ||
    !condition.operator ||
    (needsValue(condition.operator) && !hasValue(condition.value))
  ) {
    return undefined;
  }

  const column = columns.find((item) => item.field === condition.field);
  let value: unknown = condition.value;
  if (["isAnyOf", "isOneOf", "isNotOneOf", "containsOneOf"].includes(condition.operator)) {
    value = typeof condition.value === "string"
      ? condition.value.split(";").map((entry) => entry.trim()).filter(Boolean)
      : condition.value;
  } else if (column?.type === "number" && needsValue(condition.operator)) {
    value = Number(condition.value);
  } else if (column?.type === "boolean") {
    value = condition.value === true || condition.value === "true";
  } else if (column?.type === "dateTime" && needsValue(condition.operator)) {
    const dateTimeValue = condition.value as DateTimeValue | null;
    value = dateTimeValue?.dateTime?.toISOString() ?? "";
  } else if (column?.type === "time" && needsValue(condition.operator)) {
    value = condition.value instanceof Date ? localTimeValue(condition.value) : condition.value;
  }

  return {
    id: condition.id,
    field: condition.field,
    operator: condition.operator,
    value,
  };
}

function compileGroup(
  group: FilterGroupNode,
  conditionsById: ReadonlyMap<string, FilterCondition>,
  columns: readonly SuperDataGridFilterField[],
): SuperDataGridFilterGroup {
  const rules: Array<SuperDataGridFilterRule | SuperDataGridFilterGroup> = [];
  for (const rule of group.rules) {
    if (rule.kind === "group") {
      const nested = compileGroup(rule.group, conditionsById, columns);
      if (nested.rules.length > 0) rules.push(nested);
      continue;
    }
    const condition = conditionsById.get(rule.conditionId);
    if (condition) {
      const compiled = conditionToRule(condition, columns);
      if (compiled) rules.push(compiled);
    }
  }
  return { id: group.id, combinator: group.combinator, rules };
}

function flattenQuery(group: SuperDataGridFilterGroup): SuperDataGridFilterRule[] {
  return group.rules.flatMap((rule) =>
    isQueryGroup(rule) ? flattenQuery(rule) : [rule],
  );
}

function updateGroup(
  group: FilterGroupNode,
  groupId: string,
  update: (target: FilterGroupNode) => FilterGroupNode,
): FilterGroupNode {
  if (group.id === groupId) return update(group);
  return {
    ...group,
    rules: group.rules.map((rule) =>
      rule.kind === "group"
        ? { kind: "group", group: updateGroup(rule.group, groupId, update) }
        : rule,
    ),
  };
}

function removeGroup(group: FilterGroupNode, groupId: string): FilterGroupNode {
  const rules: FilterGroupRule[] = [];
  for (const rule of group.rules) {
    if (rule.kind !== "group") {
      rules.push(rule);
    } else if (rule.group.id !== groupId) {
      rules.push({ kind: "group", group: removeGroup(rule.group, groupId) });
    }
  }
  return {
    ...group,
    rules,
  };
}

function removeConditionReference(
  group: FilterGroupNode,
  conditionId: string,
): FilterGroupNode {
  const rules: FilterGroupRule[] = [];
  for (const rule of group.rules) {
    if (rule.kind === "condition") {
      if (rule.conditionId !== conditionId) rules.push(rule);
      continue;
    }
    rules.push({
      kind: "group",
      group: removeConditionReference(rule.group, conditionId),
    });
  }
  return {
    ...group,
    rules,
  };
}

function collectConditionIds(group: FilterGroupNode): string[] {
  return group.rules.flatMap((rule) =>
    rule.kind === "condition"
      ? [rule.conditionId]
      : collectConditionIds(rule.group),
  );
}

function conditionCount(group: FilterGroupNode): number {
  return collectConditionIds(group).length;
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
  const initialDefaults = useMemo(
    () => modelToDefaults(initialModel, columns, startWithBlankCondition),
    [columns, initialModel, startWithBlankCondition],
  );
  const { control, reset, setValue } = useForm<FilterFormValues>({
    defaultValues: initialDefaults.values,
  });
  const { append, fields, remove } = useFieldArray({
    control,
    name: "conditions",
    keyName: "rowKey",
  });
  const currentConditions = useWatch({ control, name: "conditions" }) ?? [];
  const [rootGroup, setRootGroup] = useState<FilterGroupNode>(initialDefaults.root);

  useEffect(() => {
    const defaults = modelToDefaults(initialModel, columns, startWithBlankCondition);
    reset(defaults.values);
    setRootGroup(defaults.root);
  }, [columns, initialModel, reset, resetKey, startWithBlankCondition]);

  const conditionsById = useMemo(
    () => new Map(currentConditions.map((condition) => [condition.id, condition])),
    [currentConditions],
  );

  useEffect(() => {
    const filterQuery = compileGroup(rootGroup, conditionsById, columns);
    const items = filterQuery.rules.length > 0 ? flattenQuery(filterQuery) : [];
    onChange({
      items,
      logicOperator:
        rootGroup.combinator === "or" ? GridLogicOperator.Or : GridLogicOperator.And,
      ...(filterQuery.rules.length > 0 ? { filterQuery } : {}),
    });
  }, [columns, conditionsById, onChange, rootGroup]);

  const handleAddCondition = useCallback(
    (groupId: string) => {
      const condition = makeEmptyCondition();
      append(condition);
      setRootGroup((current) =>
        updateGroup(current, groupId, (group) => ({
          ...group,
          rules: [...group.rules, { kind: "condition", conditionId: condition.id }],
        })),
      );
    },
    [append],
  );

  const handleAddGroup = useCallback(
    (groupId: string) => {
      const condition = makeEmptyCondition();
      const nested = makeEmptyGroup();
      nested.rules.push({ kind: "condition", conditionId: condition.id });
      append(condition);
      setRootGroup((current) =>
        updateGroup(current, groupId, (group) => ({
          ...group,
          rules: [...group.rules, { kind: "group", group: nested }],
        })),
      );
    },
    [append],
  );

  const handleRemoveCondition = useCallback(
    (conditionId: string) => {
      const index = fields.findIndex((field) => field.id === conditionId);
      if (index < 0) return;
      remove(index);
      setRootGroup((current) => removeConditionReference(current, conditionId));
    },
    [fields, remove],
  );

  const handleRemoveGroup = useCallback(
    (groupId: string) => {
      const groupToRemove = (function find(group: FilterGroupNode): FilterGroupNode | undefined {
        for (const rule of group.rules) {
          if (rule.kind !== "group") continue;
          if (rule.group.id === groupId) return rule.group;
          const nested = find(rule.group);
          if (nested) return nested;
        }
        return undefined;
      })(rootGroup);
      if (!groupToRemove) return;
      const ids = new Set(collectConditionIds(groupToRemove));
      const indexes = fields.flatMap((field, index) => ids.has(field.id) ? [index] : []);
      if (indexes.length > 0) remove(indexes);
      setRootGroup((current) => removeGroup(current, groupId));
    },
    [fields, remove, rootGroup],
  );

  const conditionCards = useMemo(() => {
    const cards = new Map<string, FormCardConfig<FilterFormValues>>();
    fields.forEach((field, index) => {
      const condition = currentConditions[index] ?? field;
      const selectedColumn = columns.find((column) => column.field === condition.field);
      const selectedOperators = operatorsFor(selectedColumn);
      const fieldPath = getPath(index, "field");
      const operatorPath = getPath(index, "operator");
      const valuePath = getPath(index, "value");
      const showValue = needsValue(condition.operator);
      const valueType = selectedColumn?.type === "boolean"
        ? FieldType.Select
        : selectedColumn?.type === "date"
          ? FieldType.Date
          : selectedColumn?.type === "dateTime"
            ? FieldType.DateTime
            : selectedColumn?.type === "time"
              ? FieldType.Time
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
              ["isAnyOf", "isOneOf", "isNotOneOf", "containsOneOf"].includes(condition.operator)
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
            customContent: () => <div className={styles.noValue}>No value required</div>,
          };

      const formFields: FieldConfig<FilterFormValues>[] = [
        {
          name: fieldPath,
          label: "Column",
          type: FieldType.Select,
          variant: "outlined",
          gridSize: { xs: 12, sm: 4 },
          placeholder: "Choose a column",
          options: columns.map((column) => ({ value: column.field, label: column.headerName })),
          modifyFieldProps: (fieldProps) => ({
            ...fieldProps,
            onChange: (event) => {
              fieldProps.onChange(event);
              setValue(operatorPath, "");
              const nextType = columns.find((column) => column.field === event.target.value)?.type;
              setValue(valuePath, emptyValueForType(nextType));
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
              setValue(valuePath, emptyValueForType(selectedColumn?.type));
            },
          }),
        },
        valueField,
      ];

      cards.set(field.id, {
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
                onClick={() => handleRemoveCondition(field.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            ),
            fields: formFields,
          },
        ],
      });
    });
    return cards;
  }, [
    columns,
    currentConditions,
    fields,
    handleRemoveCondition,
    keepOneCondition,
    setValue,
  ]);

  function renderGroup(group: FilterGroupNode, depth: number): React.ReactNode {
      const directCards = group.rules.flatMap((rule) => {
        if (rule.kind !== "condition") return [];
        const condition = conditionCards.get(rule.conditionId);
        return condition ? [condition] : [];
      });
      const nestedGroups = group.rules.flatMap((rule) =>
        rule.kind === "group" ? [rule.group] : [],
      );
      return (
        <div
          key={group.id}
          className={`${styles.filterGroup} ${depth > 0 ? styles.nestedGroup : ""}`}
          data-group-depth={depth}
        >
          <div className={styles.groupHeader}>
            <div className={styles.groupLogic}>
              <span className={styles.groupLabel}>{depth === 0 ? "Match conditions" : "Match within group"}</span>
              <ToggleButtonGroup
                value={group.combinator}
                exclusive
                size="small"
                aria-label={`How conditions in group ${depth + 1} are combined`}
                onChange={(_, value: FilterGroupCombinator | null) => {
                  if (value) {
                    setRootGroup((current) =>
                      updateGroup(current, group.id, (target) => ({ ...target, combinator: value })),
                    );
                  }
                }}
              >
                <ToggleButton value="and" data-testid={`filter-group-and-${depth}`}>
                  AND
                </ToggleButton>
                <ToggleButton value="or" data-testid={`filter-group-or-${depth}`}>
                  OR
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
            <div className={styles.groupActions}>
              <Button
                className={styles.addConditionButton}
                data-testid={`add-filter-condition-group-${depth}`}
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAddCondition(group.id)}
              >
                {addButtonLabel}
              </Button>
              <Button
                className={styles.addGroupButton}
                data-testid={`add-filter-subgroup-${depth}`}
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAddGroup(group.id)}
              >
                Add group
              </Button>
              {depth > 0 && (
                <IconButton
                  aria-label="Remove condition group"
                  className={styles.removeConditionButton}
                  data-testid={`remove-filter-subgroup-${depth}`}
                  size="small"
                  onClick={() => handleRemoveGroup(group.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </div>
          </div>
          {directCards.length > 0 && (
            <PolyForm
              cards={directCards}
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
          {nestedGroups.map((nested) => renderGroup(nested, depth + 1))}
        </div>
      );
    }

  const hasConditions = conditionCount(rootGroup) > 0;

  return (
    <section className={styles.builder} aria-label="Filter conditions">
      {title && <Typography className={styles.builderTitle}>{title}</Typography>}
      {!hasConditions && emptyMessage && (
        <Typography className={styles.emptyState}>{emptyMessage}</Typography>
      )}
      {renderGroup(rootGroup, 0)}
    </section>
  );
}
