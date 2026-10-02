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
} from "super-data-grid";

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
  const cellValue =
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
  const value = filter.value;
  const cellText = cellValue == null ? "" : String(cellValue).toLowerCase();
  const filterText = value == null ? "" : String(value).toLowerCase();

  if (operator === "isEmpty") return cellText.length === 0;
  if (operator === "isNotEmpty") return cellText.length > 0;
  if (value == null || filterText.length === 0) return true;

  if (Array.isArray(value) || operator === "isAnyOf") {
    const options = Array.isArray(value) ? value : filterText.split(";");
    return options.some(
      (option) => String(option).toLowerCase() === cellText,
    );
  }

  if (typeof cellValue === "number") {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return true;
    switch (operator) {
      case "=":
      case "equals":
        return cellValue === numericValue;
      case "!=":
        return cellValue !== numericValue;
      case ">":
        return cellValue > numericValue;
      case ">=":
        return cellValue >= numericValue;
      case "<":
        return cellValue < numericValue;
      case "<=":
        return cellValue <= numericValue;
      default:
        return false;
    }
  }

  switch (operator) {
    case "equals":
    case "=":
    case "is":
      return cellText === filterText;
    case "not":
    case "!=":
      return cellText !== filterText;
    case "startsWith":
      return cellText.startsWith(filterText);
    case "endsWith":
      return cellText.endsWith(filterText);
    case "contains":
    default:
      return cellText.includes(filterText);
  }
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
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const matchingIds = new Set(
        applyServerFilters(request.filterModel, request.includeDeleted).map(
          (user) => user.id,
        ),
      );
      const selectionModel: GridRowSelectionModel = request.rowSelectionModel;

      for (const user of largeDataset) {
        const selected =
          selectionModel.type === "include"
            ? selectionModel.ids.has(user.id)
            : matchingIds.has(user.id) && !selectionModel.ids.has(user.id);
        if (selected) user.isDeleted = true;
      }

      resolve();
    }, 300);
  });
}
