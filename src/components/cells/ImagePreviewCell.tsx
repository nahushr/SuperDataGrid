import React, { useId, useState } from "react";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import type { SuperDataGridImageOptions, SuperDataGridRow } from "../../types";
import { getProductImages } from "../../utils/predefinedCellData";
import ProductImageCarousel from "./ProductImageCarousel";
import styles from "../../styles/predefined-cells.module.css";

interface ImagePreviewCellProps {
  value: unknown;
  field?: string;
  row?: SuperDataGridRow;
  options?: SuperDataGridImageOptions;
}

function getRowTitle(
  row: SuperDataGridRow | undefined,
  titleField?: string,
): string | undefined {
  if (!row) return undefined;
  const record = row as Record<string, unknown>;
  const candidates = [titleField, "productName", "productTitle", "title", "name"]
    .filter((field): field is string => Boolean(field));

  for (const candidate of candidates) {
    const value = candidate.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, record);
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}

function formatFieldName(field?: string): string {
  if (!field) return "Product images";
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

/** Compact product-photo card which opens the image gallery. */
export default function ImagePreviewCell({
  value,
  field,
  row,
  options = {},
}: Readonly<ImagePreviewCellProps>) {
  const [open, setOpen] = useState(false);
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState("");
  const dialogTitleId = useId();
  const images = getProductImages(value, options);
  const mainImage =
    images.find((image) => image.label?.toLowerCase().includes("main")) ??
    images[0];
  const fallbackLetter = options.fallbackLetter?.slice(0, 1) || "P";
  const rowTitle = getRowTitle(row, options.titleField);
  const title = rowTitle || formatFieldName(field);
  let imageButtonLabel = "Product has no image";
  if (mainImage) {
    imageButtonLabel = `View ${images.length} product images`;
    if (rowTitle) imageButtonLabel += ` for ${rowTitle}`;
  }

  return (
    <div className={styles.productImageCell}>
      <button
        aria-label={imageButtonLabel}
        className={styles.productImageCard}
        disabled={!mainImage}
        onClick={(event) => {
          event.stopPropagation();
          if (mainImage) setOpen(true);
        }}
        type="button"
      >
        <span className={styles.productImageCardVisual}>
          {mainImage && failedThumbnailUrl !== mainImage.url ? (
            <img
              alt={mainImage.alt || options.thumbnailAlt || title}
              className={styles.productImageThumbnail}
              decoding="async"
              loading="lazy"
              onError={() => setFailedThumbnailUrl(mainImage.url)}
              src={mainImage.url}
            />
          ) : (
            <span className={styles.productImageFallback}>{fallbackLetter}</span>
          )}
          {mainImage && (
            <span className={styles.productImageCountBadge}>
              {String(images.length).padStart(2, "0")}
            </span>
          )}
          {mainImage && (
            <span className={styles.productImageExpandIcon} aria-hidden="true">
              <OpenInFullOutlinedIcon />
            </span>
          )}
        </span>
        <span className={styles.productImageCardMeta}>
          <span className={styles.productImageCardTitle}>{title}</span>
          <span className={styles.productImageCardHint}>
            <CollectionsOutlinedIcon aria-hidden="true" />
            {mainImage ? `${images.length} photos · View` : "No photos"}
          </span>
        </span>
      </button>
      <Dialog
        aria-labelledby={dialogTitleId}
        onClose={() => setOpen(false)}
        open={open}
        PaperProps={{ className: styles.productImageDialogPaper }}
      >
        <DialogTitle className={styles.productImageDialogTitle} id={dialogTitleId}>
          <span className={styles.productImageDialogHeading}>
            <span className={styles.productImageDialogEyebrow}>PRODUCT GALLERY</span>
            <span className={styles.productImageDialogName}>{title}</span>
          </span>
          <IconButton
            aria-label="Close image gallery"
            className={styles.productImageDialogClose}
            onClick={() => setOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className={styles.productImageDialogContent}>
          {open && (
            <ProductImageCarousel images={images} fallbackLetter={fallbackLetter} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
