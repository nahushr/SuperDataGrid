import {
  GridLogicOperator,
  type GridFilterItem,
  type GridFilterModel,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import {
  SUPER_DATA_GRID_ACTIONS,
  type SuperDataGridActionType,
  type SuperDataGridBulkDeleteRequest,
} from "@simplishelf/super-data-grid";

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  peopleDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo?: string;
  };
  address: {
    streetAddress: string;
    streetAddress2: string;
    streetAddress3: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    nameOnAddress: string;
    firstName: string;
    lastName: string;
    emailOnAddress: string;
    phoneOnAddress: string;
    isPrimary: boolean;
  };
  role: "Admin" | "User";
  orderTotal: number;
  currencyCode: string;
  signupDate: string;
  lastLoginAt: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  metadata: {
    source: string;
    plan: string;
    invoice: { number: string; paid: boolean };
    tags: string[];
  };
  productImage: { src: string; alt: string; label: string };
  actions: SuperDataGridActionType[];
  createdAt: string;
  createdByUserInfo: {
    firstName: string;
    lastName: string;
    loginName: string;
    fullName: string;
  };
  isDeleted: boolean;
}

export interface ServerPage {
  data: DemoUser[];
  totalCount: number;
}

export const MOCK_FETCH_DELAY_MS = 300;
export const MOCK_PAGE_CHANGE_DELAY_MS = 3000;

const MOCK_FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Jamie",
  "Drew",
  "Quinn",
  "Reese",
];
const MOCK_LAST_NAMES = [
  "Morgan",
  "Patel",
  "Chen",
  "Garcia",
  "Brooks",
  "Kim",
  "Singh",
  "Carter",
  "Rivera",
  "Bennett",
];

export const largeDataset: DemoUser[] = Array.from(
  { length: 1000 },
  (_, index) => {
    const firstName = MOCK_FIRST_NAMES[index % MOCK_FIRST_NAMES.length];
    const lastName =
      MOCK_LAST_NAMES[
        Math.floor(index / MOCK_FIRST_NAMES.length) % MOCK_LAST_NAMES.length
      ];
    const fullName = `${firstName} ${lastName}`;
    const email = `user${index + 1}@example.com`;
    const phone = `+34943482${String(9000 + index).slice(-4)}`;

    return {
      id: index + 1,
      name: fullName,
      email,
      phone,
      peopleDetails: {
        firstName,
        lastName,
        email,
        phone,
        ...(index === 0 ? { photo: "https://i.pravatar.cc/96?img=12" } : {}),
      },
      address: {
        streetAddress: "100 Primary Lead Street",
        streetAddress2: "Floor 2",
        streetAddress3: "Building C",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "10001",
        country: "India",
        nameOnAddress: fullName,
        firstName,
        lastName,
        emailOnAddress: email,
        phoneOnAddress: phone,
        isPrimary: true,
      },
      role: index % 2 === 0 ? "Admin" : "User",
      orderTotal: 1299 + ((index * 137) % 42000),
      currencyCode: "USD",
      signupDate: new Date(Date.UTC(2022, index % 12, (index % 27) + 1)).toISOString(),
      lastLoginAt: new Date(
        Date.UTC(2026, 7, 25, 20, 50 - (index % 50), 0),
      ).toISOString(),
      contactEmail: email,
      contactPhone: phone,
      description: `Account ${index + 1} is a ${index % 2 === 0 ? "premium administrator" : "standard user"} profile created for the SuperDataGrid demo. This longer sample text demonstrates a compact cell preview with the complete value available from its tooltip.`,
      metadata: {
        source: index % 2 === 0 ? "admin-console" : "self-service",
        plan: index % 3 === 0 ? "enterprise" : "standard",
        invoice: {
          number: `INV-${String(index + 1).padStart(5, "0")}`,
          paid: index % 4 !== 0,
        },
        tags: index % 2 === 0 ? ["verified", "priority"] : ["verified"],
      },
      productImage: {
        src: "/demo-product.svg",
        alt: "Blue and amber product package illustration",
        label: `Package ${String((index % 12) + 1).padStart(2, "0")}`,
      },
      actions: [
        SUPER_DATA_GRID_ACTIONS.VIEW,
        SUPER_DATA_GRID_ACTIONS.EDIT,
        SUPER_DATA_GRID_ACTIONS.DEACTIVATE,
        SUPER_DATA_GRID_ACTIONS.SHARE,
      ],
      createdAt: new Date(
        Date.UTC(2026, 7, 25, 20, 50 - (index % 50), 0),
      ).toISOString(),
      createdByUserInfo: {
        firstName: `TestUser${String(index + 1).padStart(2, "0")}`,
        lastName: `LastName${String(index + 1).padStart(2, "0")}`,
        loginName: `nahushraj+testuser${String(index + 1).padStart(2, "0")}@example.com`,
        fullName: `TestUser${String(index + 1).padStart(2, "0")} LastName${String(index + 1).padStart(2, "0")}`,
      },
      isDeleted: (index + 1) % 20 === 0,
    };
  },
);

const EMPTY_FILTER_MODEL: GridFilterModel = {
  items: [],
  logicOperator: GridLogicOperator.And,
};

function matchesFilter(user: DemoUser, filter: GridFilterItem): boolean {
  const operator = filter.operator ?? "contains";
  const [column, ...nestedPath] = filter.field.split(".");
  let cellValue: unknown;

  if (column === "peopleDetails" && nestedPath.length > 0) {
    const path = nestedPath.join(".");
    cellValue = path === "name"
      ? `${user.peopleDetails.firstName} ${user.peopleDetails.lastName}`.trim()
      : readNestedValue(user.peopleDetails, nestedPath);
  } else if (column === "address" && nestedPath.length > 0) {
    cellValue = readNestedValue(user.address, nestedPath);
  } else if (column === "createdAt" && nestedPath.length > 0) {
    const auditPath = nestedPath.join(".");
    cellValue = auditPath === "fullName" || auditPath === "name"
      ? user.createdByUserInfo.fullName
      : auditPath === "email"
        ? user.createdByUserInfo.loginName
        : auditPath === "timestamp"
          ? user.createdAt
          : readNestedValue(user.createdByUserInfo, nestedPath);
  } else if (filter.field === "orderTotal") {
    // The table displays the stored cents as a major-unit currency amount.
    cellValue = user.orderTotal / 100;
  } else {
    cellValue =
      filter.field === "peopleDetails"
        ? [user.name, user.email, user.phone].join(" | ")
        : filter.field === "address"
          ? [
              user.address.streetAddress,
              user.address.streetAddress2,
              user.address.streetAddress3,
              user.address.city,
              user.address.state,
              user.address.postalCode,
              user.address.nameOnAddress,
              user.address.emailOnAddress,
              user.address.phoneOnAddress,
            ].join(" | ")
          : filter.field === "createdAt"
            ? [
                user.createdByUserInfo.fullName,
                user.createdByUserInfo.loginName,
                user.createdAt,
              ].join(" | ")
            : user[filter.field as keyof DemoUser];
  }

  const cellValues = Array.isArray(cellValue) ? cellValue : [cellValue];
  const value = filter.value;
  const filterText = value == null ? "" : String(value).toLowerCase();
  const nonEmptyValues = cellValues.filter((entry) => entry != null && entry !== "");
  if (operator === "isEmpty") return nonEmptyValues.length === 0;
  if (operator === "isNotEmpty") return nonEmptyValues.length > 0;
  if (value == null || filterText.length === 0) return true;

  const options = Array.isArray(value)
    ? value
    : operator === "isAnyOf"
      ? filterText.split(";")
      : [value];

  if (operator === "isAnyOf") {
    return nonEmptyValues.some((entry) =>
      options.some(
        (option) => String(option).toLowerCase() === String(entry).toLowerCase(),
      ),
    );
  }

  if (nonEmptyValues.some((entry) => typeof entry === "number")) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return true;
    return nonEmptyValues.some((entry) => {
      if (typeof entry !== "number") return false;
      switch (operator) {
        case "=":
        case "equals":
          return entry === numericValue;
        case "!=":
          return entry !== numericValue;
        case ">":
          return entry > numericValue;
        case ">=":
          return entry >= numericValue;
        case "<":
          return entry < numericValue;
        case "<=":
          return entry <= numericValue;
        default:
          return false;
      }
    });
  }

  const dateOperators = new Set([
    "is",
    "not",
    "after",
    "onOrAfter",
    "before",
    "onOrBefore",
  ]);
  const dateField = /(date|time|at|on|timestamp|lastLogin)$/i.test(filter.field);
  const isDateFilter =
    value instanceof Date ||
    nonEmptyValues.some((entry) => entry instanceof Date) ||
    dateField;
  if (isDateFilter && dateOperators.has(operator)) {
    const filterDate = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(filterDate.getTime())) return true;
    const filterDay = filterDate.toISOString().slice(0, 10);
    return nonEmptyValues.some((entry) => {
      const date = entry instanceof Date ? entry : new Date(String(entry));
      if (Number.isNaN(date.getTime())) return false;
      switch (operator) {
        case "is":
          return date.toISOString().slice(0, 10) === filterDay;
        case "not":
          return date.toISOString().slice(0, 10) !== filterDay;
        case "after":
          return date.getTime() > filterDate.getTime();
        case "onOrAfter":
          return date.getTime() >= filterDate.getTime();
        case "before":
          return date.getTime() < filterDate.getTime();
        case "onOrBefore":
          return date.getTime() <= filterDate.getTime();
        default:
          return false;
      }
    });
  }

  if (nonEmptyValues.some((entry) => typeof entry === "boolean")) {
    const booleanValue = value === true || String(value).toLowerCase() === "true";
    return nonEmptyValues.some((entry) =>
      operator === "not" || operator === "!=" ? entry !== booleanValue : entry === booleanValue,
    );
  }

  const filterTextLower = String(value).toLowerCase();
  return nonEmptyValues.some((entry) => {
    const cellText = String(entry).toLowerCase();
    switch (operator) {
      case "equals":
      case "=":
      case "is":
        return cellText === filterTextLower;
      case "not":
      case "!=":
        return cellText !== filterTextLower;
      case "startsWith":
        return cellText.startsWith(filterTextLower);
      case "endsWith":
        return cellText.endsWith(filterTextLower);
      case "contains":
      default:
        return cellText.includes(filterTextLower);
    }
  });
}

function readNestedValue(value: unknown, path: readonly string[]): unknown {
  if (path.length === 0) return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => readNestedValue(entry, path))
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry]);
  }
  if (typeof value !== "object" || value === null) return undefined;
  return readNestedValue(
    (value as Record<string, unknown>)[path[0]],
    path.slice(1),
  );
}

function applyServerFilters(
  filterModel: GridFilterModel,
  includeDeleted: boolean,
): DemoUser[] {
  const visibleData = includeDeleted
    ? largeDataset
    : largeDataset.filter((user) => !user.isDeleted);
  const activeFilters = filterModel.items.filter(
    (filter) => filter.field !== "" && filter.operator !== "",
  );
  if (activeFilters.length === 0) return visibleData;

  return visibleData.filter((user) => {
    const matched = activeFilters.map((filter) => matchesFilter(user, filter));
    return filterModel.logicOperator === GridLogicOperator.Or
      ? matched.some(Boolean)
      : matched.every(Boolean);
  });
}

function getSortValue(user: DemoUser, field: string): unknown {
  if (field === "peopleDetails") return user.name;
  if (field === "address") {
    return [
      user.address.streetAddress,
      user.address.streetAddress2,
      user.address.streetAddress3,
      user.address.city,
      user.address.state,
      user.address.postalCode,
    ].join(" ");
  }
  if (field === "actions") return user.actions.join(" ");
  return user[field as keyof DemoUser];
}

function sortServerRows(
  rows: DemoUser[],
  sortModel: GridSortModel,
): DemoUser[] {
  const activeSorts = sortModel.filter((item) => item.sort != null);
  if (activeSorts.length === 0) return rows;

  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  return [...rows].sort((left, right) => {
    for (const item of activeSorts) {
      const leftValue = getSortValue(left, item.field);
      const rightValue = getSortValue(right, item.field);
      let comparison = 0;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        comparison = leftValue - rightValue;
      } else {
        comparison = collator.compare(
          leftValue == null ? "" : String(leftValue),
          rightValue == null ? "" : String(rightValue),
        );
      }

      if (comparison !== 0) {
        return item.sort === "desc" ? -comparison : comparison;
      }
    }
    return 0;
  });
}

export function fetchServerData(
  page: number,
  rowsPerPage: number,
  filterModel: GridFilterModel = EMPTY_FILTER_MODEL,
  signal?: AbortSignal,
  includeDeleted = false,
  delayMs = MOCK_FETCH_DELAY_MS,
  sortModel: GridSortModel = [],
): Promise<ServerPage> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The request was aborted.", "AbortError"));
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      const filteredData = applyServerFilters(filterModel, includeDeleted);
      const sortedData = sortServerRows(filteredData, sortModel);
      const startIndex = page * rowsPerPage;
      resolve({
        data: sortedData.slice(startIndex, startIndex + rowsPerPage),
        totalCount: filteredData.length,
      });
    }, delayMs);

    const handleAbort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

export async function fetchAllServerData(
  filterModel: GridFilterModel,
  signal: AbortSignal,
  includeDeleted = false,
): Promise<DemoUser[]> {
  const chunkSize = 100;
  const allRows: DemoUser[] = [];
  let page = 0;
  let totalCount = Number.POSITIVE_INFINITY;

  while (allRows.length < totalCount) {
    if (signal.aborted) {
      throw new DOMException("The request was aborted.", "AbortError");
    }

    const result = await fetchServerData(
      page,
      chunkSize,
      filterModel,
      signal,
      includeDeleted,
    );
    allRows.push(...result.data);
    totalCount = result.totalCount;
    page += 1;
    if (result.data.length === 0) break;
  }

  return allRows;
}

export function bulkDeleteServerRows(
  request: SuperDataGridBulkDeleteRequest<DemoUser>,
): Promise<number[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const matchingIds = new Set(
        applyServerFilters(request.filterModel, request.includeDeleted).map(
          (user) => user.id,
        ),
      );
      const selectionModel: GridRowSelectionModel = request.rowSelectionModel;
      const deletedIds = largeDataset.flatMap((user) => {
        if (user.id % 25 === 0) return [];
        const selected =
          selectionModel.type === "include"
            ? selectionModel.ids.has(user.id)
            : matchingIds.has(user.id) && !selectionModel.ids.has(user.id);
        return selected ? [user.id] : [];
      });

      const idsToDelete = new Set(deletedIds);
      for (const user of largeDataset) {
        if (idsToDelete.has(user.id)) user.isDeleted = true;
      }

      resolve(deletedIds);
    }, 300);
  });
}
