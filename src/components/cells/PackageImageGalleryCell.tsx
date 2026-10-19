import React from "react";
import ImagePreviewCell from "./ImagePreviewCell";
import type { SuperDataGridRow } from "../../types";

interface PackageImageGalleryCellProps {
  row: SuperDataGridRow;
  thumbnailOnly?: boolean;
}

const ATTACHMENT_FIELDS = [
  ["attachment1Url", "Image 1"],
  ["attachment2Url", "Image 2"],
  ["attachment3Url", "Image 3"],
  ["attachment4Url", "Image 4"],
  ["attachment5Url", "Image 5"],
] as const;

function getImages(row: Readonly<Record<string, unknown>>) {
  const nested = row._package;
  const packageData = nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : row;

  return ATTACHMENT_FIELDS.flatMap(([field, label]) => {
    const url = packageData[field] ?? row[field];
    return typeof url === "string" && url.trim()
      ? [{ url: url.trim(), label }]
      : [];
  });
}

/** Package-owned image preview and gallery for the standard package attachments. */
export default function PackageImageGalleryCell({
  row,
  thumbnailOnly = false,
}: Readonly<PackageImageGalleryCellProps>) {
  const record = row as Record<string, unknown>;
  const packageRecord = record._package && typeof record._package === "object"
    ? record._package as Record<string, unknown>
    : record;
  const name = packageRecord.packageName ?? record.packageName;
  const fallbackLetter = typeof name === "string" && name.trim()
    ? name.trim().slice(0, 1)
    : "P";

  return (
    <ImagePreviewCell
      field="Package images"
      options={{
        entityLabel: "package",
        fallbackLetter,
        thumbnailAlt: "Package image",
        titleField: "_package.packageName",
        thumbnailOnly,
      }}
      row={row}
      value={getImages(record)}
    />
  );
}
