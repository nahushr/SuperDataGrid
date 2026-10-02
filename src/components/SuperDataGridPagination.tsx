import React from "react";
import {
  Box,
  MenuItem,
  Pagination,
  Select,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  gridPageCountSelector,
  gridPaginationModelSelector,
  gridPaginationRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import styles from "../styles/pagination.module.css";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500];

export default function SuperDataGridPagination() {
  const compactPagination = useMediaQuery("(max-width: 700px)");
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  const firstRow =
    rowCount === 0 ? 0 : paginationModel.page * paginationModel.pageSize + 1;
  const lastRow = Math.min(
    (paginationModel.page + 1) * paginationModel.pageSize,
    rowCount,
  );

  return (
    <Box className={styles.pagination}>
      <Box className={styles.pageSizeControls}>
        <Typography variant="body2" className={styles.paginationLabel}>
          Rows per page:
        </Typography>
        <Select
          size="small"
          value={paginationModel.pageSize}
          onChange={(event) =>
            apiRef.current.setPageSize(Number(event.target.value))
          }
          inputProps={{ "aria-label": "Rows per page" }}
          className={styles.pageSizeSelect}
        >
          {PAGE_SIZE_OPTIONS.map((pageSize) => (
            <MenuItem key={pageSize} value={pageSize}>
              {pageSize}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="body2" className={styles.rowRange}>
          {firstRow}–{lastRow} of {rowCount}
        </Typography>
      </Box>

      <Pagination
        className={styles.pages}
        count={Math.max(1, pageCount)}
        page={paginationModel.page + 1}
        onChange={(_event, page) => apiRef.current.setPage(page - 1)}
        shape="rounded"
        variant="outlined"
        disabled={rowCount === 0}
        siblingCount={compactPagination ? 0 : 1}
        boundaryCount={1}
        aria-label="Grid pages"
      />
    </Box>
  );
}
