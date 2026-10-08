<p align="center">
  <img src="assets/super-data-grid-logo.png" alt="SuperDataGrid" width="560" />
</p>

<p align="center">
  <a href="https://github.com/nahushr/SuperDataGrid/actions/workflows/deploy.yml"><img alt="CI" src="https://github.com/nahushr/SuperDataGrid/actions/workflows/deploy.yml/badge.svg?branch=main" /></a>
  <img alt="React 18+" src="https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=111827" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-types%20included-3178C6?logo=typescript&logoColor=white" />
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-16a085.svg" /></a>
</p>

<p align="center">
  <a href="https://stackblitz.com/github/nahushr/SuperDataGrid?startScript=dev:example&file=examples/src/App.tsx"><img alt="Open the React example in StackBlitz" src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" /></a>
</p>

## Demo

| Online | Local |
|---|---|
| [Open the React example in StackBlitz](https://stackblitz.com/github/nahushr/SuperDataGrid?startScript=dev:example&file=examples/src/App.tsx) | `npm run dev:example` → [localhost:7000](http://localhost:7000) |

The example uses a mock server with 1,000 users and demonstrates server-side filtering, sorting, pagination, selection across pages, saved views, bulk delete, export, built-in cell renderers, and action callbacks. It also displays callback results as JSON above the grid.

## Install and import

SuperDataGrid wraps MUI X DataGrid and generates its column definitions from a list of field names. Install it alongside its UI peer dependencies:

```sh
npm install @simplishelf/super-data-grid @mui/material @mui/x-data-grid @mui/icons-material @emotion/react @emotion/styled
```

Your application should already include `react` and `react-dom`.

```tsx
import SuperDataGrid from "@simplishelf/super-data-grid";
import "@simplishelf/super-data-grid/style.css";

const columns = ["name", "category", "price"];
const data = [
  { name: "Coffee", category: "Drinks", price: 12.5 },
  { name: "Tea", category: "Drinks", price: 8.25 },
];

export function Products() {
  return <SuperDataGrid columns={columns} data={data} />;
}
```

Column names are object keys. Header labels are generated from those names, so `productName` displays as “Product Name” and `created_at` displays as “Created at”. Rows can provide an `id` or `_id`; the component assigns a positional ID when neither is present.

The grid workspace has an 800px minimum height by default and 12px of vertical breathing room. Override the minimum with `minHeight={900}` (numbers are pixels) or a CSS length such as `minHeight="90vh"`. Set `height` to size the workspace itself, for example `height="calc(100vh - 64px)"` for a grid below a fixed 64px app bar.

Columns without an explicit `width` or `flex` are measured from their rendered headers and cells after data loads. Set `width` for a fixed size or `flex` for proportional sizing; `minWidth` and `maxWidth` continue to constrain the measured width. Unconfigured columns use content-based sizing by default.

Use `beforeTable` to render host-provided content between the grid toolbar and the column headers. The example uses this slot to show the latest action output.
Use `onResetToDefault` to show the built-in warning-colored “Reset to default” button immediately after Export. The callback resets preferences managed by the host application. Use `toolbarActions` for other host buttons on the right side of the main toolbar, before the built-in bulk-delete and Include Deleted controls.

The default page size is 25. Users can choose 10, 25, 50, 100, or 500 rows per page. Click a column header to sort ascending, descending, or clear the sort. Sorting, filtering, and pagination default to client-side behavior and can be switched independently to server-side behavior. For server-side sorting, control `sortModel` and handle `onSortModelChange`, then sort the full result set before slicing it into pages. Row heights are fixed by default for smoother virtualized scrolling; pass `getRowHeight={() => "auto"}` when wrapped cell content needs each row to grow. Headers wrap long labels, and cell content stays left-aligned and vertically centered.

When a column's raw row value is a JSON object, the Filter dialog and Add/Edit View dialog discover its scalar paths as filter choices, such as `peopleDetails.name`, `peopleDetails.email`, and `address.city`. These paths stay hidden from the visible grid. Server-side handlers receive the dotted field name in `filterModel`, so resolve it against the raw row before applying the selected operator. Custom cell components should render from the raw `value` or `row` passed to them; the filter choices come from that same row data.

```tsx
<SuperDataGrid
  columns={columns}
  data={currentPageRows}
  filterMode="server"
  paginationMode="server"
  rowCount={totalRows}
  paginationModel={paginationModel}
  onPaginationModelChange={setPaginationModel}
  onFilterModelChange={setFilterModel}
  getAllData={async ({ filterModel, signal, includeDeleted }) => {
    // Fetch every row matching these filters. Fetch in batches if needed,
    // apply the deleted-row preference, and pass signal through so navigation
    // can cancel the export.
    return fetchAllMatchingRows({ filterModel, includeDeleted, signal });
  }}
/>
```

When a server-side grid exports, the user can choose the current page or all matching data. The all-pages action calls `getAllData`; that function can retrieve large result sets in chunks. The Export button shows a loader while it runs, while the rest of the grid remains usable. The request is aborted when the grid unmounts or the browser navigates away. If `getAllData` is omitted, all-pages export is disabled.

Cell content can be replaced with a React component for selected fields:

```tsx
import type { SuperDataGridCellProps } from "@simplishelf/super-data-grid";

type ProductRow = { name: string; inStock: boolean };

function StockCell({ value, row }: SuperDataGridCellProps<ProductRow>) {
  return <span>{value ? `In stock: ${row.name}` : "Out of stock"}</span>;
}

<SuperDataGrid
  columns={columns}
  data={data}
  cellComponents={{ inStock: StockCell }}
/>
```

Common SimpliShelf-style cells are available without writing a renderer. Keep `columns` as field names and mark those fields with `columnTypes`:

```tsx
<SuperDataGrid
  columns={["id", "peopleDetails", "address"]}
  columnTypes={{
    peopleDetails: "peopleDetails",
    address: "address",
  }}
  data={data}
/>
```

`peopleDetails` reads a value such as `{ name, email, phone }` (or `{ firstName, lastName, email, phone, photo }`) and renders the name, a mail link, and a phone link. `photo` can be an image URL; `photoUrl`, `avatarUrl`, `imageUrl`, `profilePicture`, and `profilePhoto` are also supported. Without a photo, the avatar shows the first-name initial on one of ten colors chosen consistently from the row ID. The palette is exported as `SUPER_DATA_GRID_AVATAR_COLORS`. `address` accepts one address object or an array of addresses, uses the primary address when present, and renders street and city/state/postal code with compact spacing. It also renders `nameOnAddress`, `emailOnAddress`, and `phoneOnAddress` when those fields are present. These fields remain ordinary JSON in your row data. A custom `cellComponents` renderer takes precedence if supplied for the same column.

Use the `audit` type for a SimpliShelf-style audit cell with a person's full name, email, and UTC timestamp. For `createdAt`/`updatedAt` columns, the timestamp is read from the column value and the person is inferred from `createdByUserInfo`/`updatedByUserInfo` on the row. An audit object can also contain `name`, `email`, and `timestamp` (or `dateTime`):

```tsx
<SuperDataGrid
  columns={["createdAt"]}
  columnTypes={{ createdAt: "audit" }}
  data={[
    {
      createdAt: "2026-08-25T20:50:00Z",
      createdByUserInfo: {
        firstName: "TestUser01",
        lastName: "LastName01",
        loginName: "user@example.com",
      },
    },
  ]}
/>
```

The audit cell links the email address, formats the date as `25th Aug 2026, 8:50 PM UTC`, and wraps long text. Audit values remain regular row data; no special cell component is required.

## Predefined cells

Additional built-in cell types cover common values. Configure the renderer with `columnTypes` and pass per-column settings through `columnOptions`:

| Type | Behavior | Per-column options |
|---|---|---|
| `badge` | Status or category pill with per-value label, background, text color, and optional React icon. | `labels`, `colors`, `fontColors`, `icons`, `fallbackLabel`, `fallbackColor` |
| `currency` | Grouped, locale-aware currency display with a prominent total; supports row-specific currency codes and integer minor units. | `currency`, `currencyField`, `locale`, `amountInMinorUnits`, `minorUnits`, `showIcon` |
| `date` / `dateTime` | Localized date or date-time with a calendar icon and optional time zone. | `locale`, `timeZone`, `formatOptions`, `showIcon` |
| `email` / `phone` | Clickable mail and telephone links with optional icons; phone values include a country flag when the country can be resolved. | `showIcon`, `showFlag`, and for phones `countryCode` / `format` |
| `longText` | Short cell preview with the full value in a tooltip. | `maxPreviewLength` |
| `json` | Compact preview that opens formatted JSON with a copy action. | `maxPreviewLength` |
| `image` | Compact product-photo card that opens a large gallery with previous/next controls, a selectable thumbnail strip, and keyboard navigation. Accepts a URL, an array of `{ url, label }`, an `{ images: [...] }` object, or SimpliShelf product image fields. | `titleField`, `altField`, `labelField`, `thumbnailAlt`, `fallbackLetter` |
| `priceBreakdown` | Purchase-order total with a detailed dialog for subtotal, discount, packaging, shipping, fees, tax, and total. | Currency options plus `title` and `labels` |

Badge colors are named, CSS-backed tokens exported as `SUPER_DATA_GRID_BADGE_COLORS`; independently select the text color and pass React icons per status. The palette supports primary, info, success, warning, error, purple, neutral, teal, cyan, indigo, orange, and slate. For currency values stored as integer cents, set `amountInMinorUnits: true` and `minorUnits: 2`.

```tsx
import SuperDataGrid, {
  SUPER_DATA_GRID_BADGE_COLORS,
} from "@simplishelf/super-data-grid";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

const columns = ["role", "orderTotal", "signupDate", "lastLoginAt", "contactEmail", "contactPhone", "description", "metadata", "productImage"];
const columnTypes = {
  role: "badge",
  orderTotal: "priceBreakdown",
  signupDate: "date",
  lastLoginAt: "dateTime",
  contactEmail: "email",
  contactPhone: "phone",
  description: "longText",
  metadata: "json",
  productImage: "image",
} as const;

<SuperDataGrid
  columns={columns}
  data={rows}
  columnTypes={columnTypes}
  columnOptions={{
    role: {
      badge: {
        labels: { Admin: "Administrator", User: "User" },
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
        fallbackColor: SUPER_DATA_GRID_BADGE_COLORS.WARNING,
      },
    },
    orderTotal: {
      priceBreakdown: {
        locale: "en-US",
        amountInMinorUnits: true,
        minorUnits: 2,
      },
    },
    signupDate: { date: { locale: "en-US", timeZone: "UTC" } },
    lastLoginAt: { dateTime: { locale: "en-US", timeZone: "UTC" } },
    contactPhone: { phone: { countryCode: "US", format: "international", showFlag: true } },
  }}
/>
```

For the `priceBreakdown` type, pass a purchase-order summary object in the `orderTotal` field. The grid shows the grand total in that same cell and opens the complete subtotal, discount, packaging, shipping, fees, tax, and total breakdown when clicked. `productImage` accepts multiple product images; it prefers a label containing “Main” for the card thumbnail and opens the full gallery when selected. Set `titleField` to a row property such as `productName` to show that product name in the cell and gallery heading.

```ts
const order = {
  currency: "USD",
  productsSubtotal: 125000,
  totalDiscount: 5000,
  packagingFee: 1500,
  totalShipping: 4000,
  serviceFee: 300,
  subtotal: 125800,
  gstPercentage: 18,
  gstAmount: 22644,
  grandTotal: 148444,
};

const productImages = [
  { url: "/images/main.jpg", label: "Main" },
  { url: "/images/front.jpg", label: "Front" },
  { url: "/images/details.jpg", label: "Details" },
];
```

Use `amountInMinorUnits: true` for values stored as cents/paise; without it, amounts are treated as major units. `SUPER_DATA_GRID_PRODUCT_IMAGE_FIELDS` exports the recognized SimpliShelf product image field names and labels.

All built-in types continue to receive and render raw row data. Nested JSON values can also expose their scalar paths in the grid's filter and saved-view builders.

Use the `actions` type to render the predefined View, Edit, Deactivate, and Share actions. Pass the action constants in the order you want; the grid keeps that order and uses each action's matching icon, label, and color. `onAction` receives the action, field name, and row when a button is clicked:

```tsx
import SuperDataGrid, {
  SUPER_DATA_GRID_ACTIONS,
  type SuperDataGridActionType,
} from "@simplishelf/super-data-grid";

type UserRow = { id: number; actions: SuperDataGridActionType[] };

const data: UserRow[] = [
  {
    id: 1,
    actions: [
      SUPER_DATA_GRID_ACTIONS.VIEW,
      SUPER_DATA_GRID_ACTIONS.EDIT,
      SUPER_DATA_GRID_ACTIONS.DEACTIVATE,
      SUPER_DATA_GRID_ACTIONS.SHARE,
    ],
  },
];

<SuperDataGrid<UserRow>
  columns={["id", "actions"]}
  columnTypes={{ actions: "actions" }}
  data={data}
  onAction={({ action, row }) => handleUserAction(action, row)}
/>
```

Only the exported action constants are rendered; unknown values are ignored. Omit `onAction` if the cell is for display only.

The grid exposes callbacks for its interactive controls. `onFilterModelChange`, `onPaginationModelChange`, `onRowSelectionModelChange`, `onIncludeDeletedChange`, `onViewsChange`, and `onSelectedViewChange` report their corresponding data changes. `onPageChange` reports the zero-based page, and `onPageSizeChange` reports the selected rows-per-page value. `density` with `onDensityChange` and `columnVisibilityModel` with `onColumnVisibilityModelChange` can be used as controlled state or as change notifications.

Additional event callbacks are `onFilterPanelOpenChange`, `onAddViewOpenChange`, `onViewsOpenChange`, `onViewAdded`, `onViewUpdated`, `onViewDeleted`, and `onExport`. The export request includes its format, scope, visible columns, current filters and pagination, and Include Deleted state. The demo shows callback activity with a Snackbar; the package itself does not include that Snackbar.

Row selection is opt-in. `checkboxSelection` adds row checkboxes and a header checkbox; the toolbar shows **Clear Selection** when rows are selected. In a server-side grid, checking the header opens a scope dialog for the current page or all matching rows. Provide `getAllRows` when a custom `isRowSelectable` rule must also be applied to rows that are not currently loaded. Without a custom rule, the grid can represent all-matching selection with MUI's exclude selection model.

```tsx
<SuperDataGrid
  columns={columns}
  data={currentPageRows}
  checkboxSelection
  selectionLabel="users"
  isRowSelectable={({ row }) => !row.archived}
  getAllRows={async ({ filterModel, signal, includeDeleted }) =>
    fetchAllMatchingUsers({ filterModel, includeDeleted, signal })
  }
  rowSelectionModel={selectionModel}
  onRowSelectionModelChange={setSelectionModel}
  includeDeleted={includeDeleted}
  onIncludeDeletedChange={setIncludeDeleted}
  onBulkDelete={async ({ rowSelectionModel, filterModel, includeDeleted }) => {
    await deleteSelectedUsers({ rowSelectionModel, filterModel, includeDeleted });
  }}
/>
```

Omit `checkboxSelection` to hide selection controls. `isRowSelectable` receives each row and can disable its checkbox. `rowSelectionModel` and `onRowSelectionModelChange` are optional; omit both for internal selection state.
The **Include Deleted** checkbox appears when `onIncludeDeletedChange` is provided. The callback should update the controlled `includeDeleted` prop and reload server data. That value is also passed to all-rows and export fetch callbacks. Pass `hideIncludeDeleted` to hide the checkbox.

When `checkboxSelection` and `onBulkDelete` are provided, the toolbar adds a red **Bulk delete** button that immediately calls the callback without opening a menu or confirmation dialog. The callback receives the selection model, active filters, Include Deleted state, selected count, and currently loaded selected rows. For server-side grids, `loadedSelectedRows` contains only loaded rows; use `rowSelectionModel` and `filterModel` to perform a bulk operation across pages. Pass `hideBulkDelete` to hide the button.

Saved views have independent filter conditions, a name, and optional notes. Add and edit open in a modal with a dedicated view filter builder; they do not copy conditions from the main grid filter panel. The component keeps views in local state by default, or the application can control them with `views` and `onViewsChange`. Use `onViewAdded`, `onViewUpdated`, and `onViewDeleted` to observe individual view operations.

```tsx
import type { SuperDataGridView } from "@simplishelf/super-data-grid";

const [views, setViews] = useState<SuperDataGridView[]>([]);

<SuperDataGrid
  columns={columns}
  data={data}
  views={views}
  onViewsChange={setViews}
/>
```

The package declares React, MUI Material, MUI X DataGrid, MUI Icons, and Emotion as peer dependencies. Consumers should have those packages in their app. `write-excel-file` is installed as a runtime dependency for XLSX downloads. The grid provides filtering, column visibility, density controls, and export for XLSX, CSV, JSON, and SQL. Exports include visible columns; SQL files contain `INSERT` statements for `super_data_grid`.

## Reusable styled components and overrides

The package exports the same ready-to-use cells and action controls used by its grid and examples: `AddressCell`, `CreatedByCell`, `DateCell`, `EmailCell`, `PhoneCell`, `UserContactCell`, `UTCTimestampCell`, `RenderLongCellItem`, `GridActionsCell`, `GridActionButton`, `GridActionBar`, and `GridErrorDetailsDialog`. Their default palette, spacing, contact links, and typography are included in `style.css`; no SimpliShelf stylesheet is needed. The stylesheet also loads Inter and JetBrains Mono for the package's sans-serif and code styles.

Override the grid at the workspace, grid, cell, row, or individual column level. Cell components accept `className`; cells with multiple visual parts also accept `classes` or part-specific class props.

```tsx
<SuperDataGrid
  columns={["name", "email"]}
  data={rows}
  className="my-grid-workspace"
  gridClassName="my-grid-root"
  cellClassName="my-grid-cell"
  columnHeaderClassName="my-grid-header"
  rowClassName="my-grid-row"
  columnConfiguration={{
    email: {
      cellClassName: "my-email-cell",
      headerClassName: "my-email-header",
    },
  }}
/>
```

Use the exported action components to get the same defaults outside the grid toolbar:

```tsx
import { GridActionBar, GridActionButton } from "@simplishelf/super-data-grid";

<GridActionBar>
  <GridActionButton appearance="primary" onClick={addRecord}>
    Add record
  </GridActionButton>
  <GridActionButton appearance="secondary" onClick={importRecords}>
    Import
  </GridActionButton>
</GridActionBar>
```

## Run the example

The example app consumes this repository through a local `file:` dependency and demonstrates server-side pagination, filtering, row selection, Include Deleted, and bulk soft delete over 1,000 mock users. Ordinary mock requests add 300 ms latency, while page navigation waits three seconds to demonstrate the animated “Fetching details” grid overlay. All-pages exports and Select all fetch matching rows in chunks. Every 25th example row is disabled for selection. The example builds the local package before starting Vite:

```sh
npm ci
npm run dev:example
```

Vite serves the example at [http://localhost:7000](http://localhost:7000).

## Publish

Run `npm run build`, then publish the package with `npm publish`. The published files are limited to `dist/` and the package metadata.
