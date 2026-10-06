import { useCallback, useEffect, useRef, useState } from "react";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  GridLogicOperator,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import SuperDataGrid, {
  type SuperDataGridAllDataRequest,
  type SuperDataGridAllRowsRequest,
  type SuperDataGridBulkDeleteRequest,
  type SuperDataGridColumnOptions,
  type SuperDataGridView,
  SUPER_DATA_GRID_BADGE_COLORS,
} from "@simplishelf/super-data-grid";
import DemoActionJsonPanel from "./components/DemoActionJsonPanel";
import { useDemoSnackbar } from "./components/DemoSnackbarProvider";
import {
  fetchAllServerData,
  bulkDeleteServerRows,
  fetchServerData,
  MOCK_FETCH_DELAY_MS,
  MOCK_PAGE_CHANGE_DELAY_MS,
  type DemoUser,
} from "./mockServer";

const columns = [
  "id",
  "role",
  "orderTotal",
  "signupDate",
  "lastLoginAt",
  "contactEmail",
  "contactPhone",
  "description",
  "metadata",
  "productImage",
  "peopleDetails",
  "address",
  "createdAt",
  "actions",
];
const columnTypes = {
  peopleDetails: "peopleDetails",
  address: "address",
  createdAt: "audit",
  role: "badge",
  orderTotal: "priceBreakdown",
  signupDate: "date",
  lastLoginAt: "dateTime",
  contactEmail: "email",
  contactPhone: "phone",
  description: "longText",
  metadata: "json",
  productImage: "image",
  actions: "actions",
} as const;
const columnOptions = {
  role: {
    badge: {
      labels: { Admin: "Admin", User: "User" },
      colors: {
        Admin: SUPER_DATA_GRID_BADGE_COLORS.INDIGO,
        User: SUPER_DATA_GRID_BADGE_COLORS.NEUTRAL,
      },
      fontColors: {
        Admin: SUPER_DATA_GRID_BADGE_COLORS.INDIGO,
        User: SUPER_DATA_GRID_BADGE_COLORS.SLATE,
      },
      icons: {
        Admin: <AdminPanelSettingsOutlinedIcon />,
        User: <PersonOutlineIcon />,
      },
      fallbackLabel: "Unknown",
      fallbackColor: "warning",
    },
  },
  orderTotal: {
    priceBreakdown: {
      locale: "en-US",
      amountInMinorUnits: true,
      minorUnits: 2,
    },
  },
  signupDate: {
    date: {
      locale: "en-US",
      timeZone: "UTC",
      formatOptions: { dateStyle: "medium" },
    },
  },
  lastLoginAt: {
    dateTime: {
      locale: "en-US",
      timeZone: "UTC",
      formatOptions: { dateStyle: "medium", timeStyle: "short" },
    },
  },
  contactEmail: { email: { showIcon: true } },
  contactPhone: {
    phone: { showIcon: true, showFlag: true, countryCode: "ES", format: "international" },
  },
  description: { longText: { maxPreviewLength: 110 } },
  metadata: { json: { maxPreviewLength: 82 } },
  productImage: {
    image: {
      altField: "alt",
      labelField: "label",
      titleField: "productName",
      thumbnailAlt: "Product photo",
      fallbackLetter: "P",
    },
  },
} satisfies Partial<Record<string, SuperDataGridColumnOptions>>;

const initialViews: SuperDataGridView[] = [
  {
    id: "admins",
    name: "Admins",
    notes: "Users with administrator access",
    filterModel: {
      items: [{ field: "role", operator: "equals", value: "Admin" }],
      logicOperator: GridLogicOperator.And,
    },
  },
  {
    id: "users",
    name: "Users",
    notes: "Standard user accounts",
    filterModel: {
      items: [{ field: "role", operator: "equals", value: "User" }],
      logicOperator: GridLogicOperator.And,
    },
  },
];

const initialFilterModel: GridFilterModel = {
  items: [],
  logicOperator: GridLogicOperator.And,
};

export default function App() {
  const notify = useDemoSnackbar();
  const [data, setData] = useState<DemoUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [filterModel, setFilterModel] = useState(initialFilterModel);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [actionJson, setActionJson] = useState<string | number[]>([]);
  const [views, setViews] = useState(initialViews);
  const previousQueryRef = useRef({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    filterModel,
    sortModel,
    includeDeleted,
  });

  useEffect(() => {
    const previousQuery = previousQueryRef.current;
    const isPageNavigation =
      previousQuery.page !== paginationModel.page &&
      previousQuery.pageSize === paginationModel.pageSize &&
      previousQuery.filterModel === filterModel &&
      previousQuery.sortModel === sortModel &&
      previousQuery.includeDeleted === includeDeleted;
    previousQueryRef.current = {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      filterModel,
      sortModel,
      includeDeleted,
    };

    const controller = new AbortController();
    setLoading(true);

    void fetchServerData(
      paginationModel.page,
      paginationModel.pageSize,
      filterModel,
      controller.signal,
      includeDeleted,
      isPageNavigation ? MOCK_PAGE_CHANGE_DELAY_MS : MOCK_FETCH_DELAY_MS,
      sortModel,
    )
      .then((result) => {
        setData(result.data);
        setTotalCount(result.totalCount);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Could not load the example grid data.", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [dataRevision, filterModel, includeDeleted, paginationModel, sortModel]);

  const handleFilterModelChange = useCallback((model: GridFilterModel) => {
    setFilterModel(model);
    setPaginationModel((current) => ({ ...current, page: 0 }));
    const filterCount = model.items.filter(
      (filter) => filter.field !== "" && filter.operator !== "",
    ).length;
    notify(`Filters updated (${filterCount} active)`);
  }, [notify]);

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      setSortModel(model);
      setPaginationModel((current) => ({ ...current, page: 0 }));
      const sort = model[0];
      notify(
        sort?.sort
          ? `Sorted by ${sort.field} (${sort.sort === "asc" ? "ascending" : "descending"})`
          : "Sorting cleared",
      );
    },
    [notify],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPaginationModel((current) => ({ ...current, page }));
      notify(`Fetching page ${page + 1}…`);
    },
    [notify],
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      setPaginationModel((current) => ({ ...current, page: 0, pageSize }));
      notify(`Rows per page changed to ${pageSize}`);
    },
    [notify],
  );

  const handleIncludeDeletedChange = useCallback((value: boolean) => {
    setIncludeDeleted(value);
    setPaginationModel((current) => ({ ...current, page: 0 }));
    notify(value ? "Include Deleted enabled" : "Include Deleted disabled");
  }, [notify]);

  const getAllData = useCallback(
    ({ filterModel: activeFilters, signal, includeDeleted: showDeleted }: SuperDataGridAllDataRequest) =>
      fetchAllServerData(activeFilters, signal, showDeleted),
    [],
  );
  const getAllRows = useCallback(
    ({ filterModel: activeFilters, signal, includeDeleted: showDeleted }: SuperDataGridAllRowsRequest) =>
      fetchAllServerData(activeFilters, signal, showDeleted),
    [],
  );

  const handleBulkDelete = useCallback(
    async (request: SuperDataGridBulkDeleteRequest<DemoUser>) => {
      const deletedIds = await bulkDeleteServerRows(request);
      setActionJson(deletedIds);
      setPaginationModel((current) => ({ ...current, page: 0 }));
      setDataRevision((revision) => revision + 1);
      notify(`Bulk delete completed for ${request.selectedCount} users`);
    },
    [notify],
  );

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">React component</p>
          <h1>SuperDataGrid</h1>
          <p className="intro">
            Browse 1,000 mock users with server-side filtering and pagination.
            Save filters as views, export matching data, and select rows across
            server pages. People details and address columns use the built-in
            SimpliShelf-style renderers. Badge, currency, date/time, contact,
            long-text, JSON, and image cells demonstrate the other reusable
            renderers. Deleted users are hidden by default,
            and every 25th row is disabled for selection as an example. The
            action column uses the predefined View, Edit, Deactivate, and Share
            buttons.
          </p>
        </div>
          <span className="version-chip">Mock server · 3 s page delay</span>
      </header>

      <section className="grid-section" aria-label="Server-side user data grid">
        <SuperDataGrid
          columns={columns}
          columnTypes={columnTypes}
          columnOptions={columnOptions}
          data={data}
          beforeTable={<DemoActionJsonPanel value={actionJson} />}
          minHeight={900}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          filterMode="server"
          paginationMode="server"
          rowCount={totalCount}
          paginationModel={paginationModel}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          filterModel={filterModel}
          onFilterModelChange={handleFilterModelChange}
          onFilterPanelOpenChange={(open) =>
            notify(open ? "Filter panel opened" : "Filter panel closed")
          }
          onColumnVisibilityModelChange={(model) => {
            const visibleCount = columns.filter(
              (field) => model[field] !== false,
            ).length;
            notify(`Column visibility changed (${visibleCount} visible)`);
          }}
          onDensityChange={(density) =>
            notify(`Density changed to ${density}`)
          }
          getAllData={getAllData}
          getAllRows={getAllRows}
          includeDeleted={includeDeleted}
          onIncludeDeletedChange={handleIncludeDeletedChange}
          onBulkDelete={handleBulkDelete}
          onAction={({ action, row }) => {
            const actionLabel =
              action === "deactivate"
                ? "Deactivate"
                : action.charAt(0).toUpperCase() + action.slice(1);
            setActionJson(`${actionLabel}, selected for IDs [${row.id}]`);
            notify(`${actionLabel} action selected for ${row.name}`);
          }}
          checkboxSelection
          selectionLabel="users"
          isRowSelectable={({ row }) => row.id % 25 !== 0}
          views={views}
          onViewsChange={(nextViews) => {
            setViews(nextViews);
            notify("Saved views updated");
          }}
          onViewAdded={(view) => notify(`View added: ${view.name}`)}
          onViewUpdated={(view) => notify(`View updated: ${view.name}`)}
          onViewDeleted={(view) => notify(`View deleted: ${view.name}`)}
          onSelectedViewChange={(viewId) => {
            const viewName = views.find((view) => view.id === viewId)?.name;
            notify(`View selected: ${viewName ?? "All data"}`);
          }}
          onViewsOpenChange={(open) =>
            notify(open ? "Views opened" : "Views closed")
          }
          onAddViewOpenChange={(open) =>
            notify(open ? "View editor opened" : "View editor closed")
          }
          onExport={({ format, scope }) =>
            notify(
              `${format.toUpperCase()} export started (${scope === "currentPage" ? "current page" : "all matching data"})`,
            )
          }
          onRowSelectionModelChange={(model) => {
            const selectedCount =
              model.type === "exclude"
                ? Math.max(totalCount - model.ids.size, 0)
                : model.ids.size;
            notify(`Selection updated (${selectedCount} users)`);
          }}
          loading={loading}
        />
      </section>
    </main>
  );
}
