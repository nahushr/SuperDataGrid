import React, { useState } from "react";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import { OpsModalDialog } from "@simplishelf/opscards";
import type {
  SuperDataGridImageOptions,
  SuperDataGridImageVariant,
  SuperDataGridRow,
} from "../../types";
import { getProductImages } from "../../utils/predefinedCellData";
import ProductImageCarousel from "./ProductImageCarousel";
import styles from "../../styles/predefined-cells.module.css";

interface ImagePreviewCellProps {
  value: unknown;
  field?: string;
  row?: SuperDataGridRow;
  options?: SuperDataGridImageOptions;
  imageVariants?: readonly SuperDataGridImageVariant[];
  selectedVariantId?: string;
}

function getRowTitle(
  row: SuperDataGridRow | undefined,
  titleField?: string,
): string | undefined {
  if (!row) return undefined;
  const record = row as Record<string, unknown>;
  const candidates = [titleField, "productName", "productTitle", "packageName", "title", "name"]
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
  imageVariants = [],
  selectedVariantId,
}: Readonly<ImagePreviewCellProps>) {
  const [open, setOpen] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string>();
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState("");
  const images = getProductImages(value, options);
  const activeVariant =
    imageVariants.find((variant) => variant.id === activeVariantId) ??
    imageVariants[0];
  const galleryImages = activeVariant?.images ?? images;
  const mainImage =
    images.find((image) => image.label?.toLowerCase().includes("main")) ??
    images[0];
  const fallbackLetter = options.fallbackLetter?.slice(0, 1) || "P";
  const rowTitle = getRowTitle(row, options.titleField);
  const title = rowTitle || formatFieldName(field);
  const entityLabel = options.entityLabel?.trim() || "product";
  let imageButtonLabel = `${entityLabel[0]?.toUpperCase()}${entityLabel.slice(1)} has no image`;
  if (mainImage) {
    imageButtonLabel = `View ${images.length} ${entityLabel} image${images.length === 1 ? "" : "s"}`;
    if (rowTitle) imageButtonLabel += ` for ${rowTitle}`;
  }

  return (
    <div className={`${styles.productImageCell} ${options.thumbnailOnly ? styles.productImageCellThumbnailOnly : ""}`}>
      <button
        aria-label={imageButtonLabel}
        className={`${styles.productImageCard} ${options.thumbnailOnly ? styles.productImageCardThumbnailOnly : ""}`}
        disabled={!mainImage}
        onClick={(event) => {
          event.stopPropagation();
          if (mainImage) {
            setActiveVariantId(
              imageVariants.find((variant) => variant.id === selectedVariantId)?.id ??
                imageVariants[0]?.id,
            );
            setOpen(true);
          }
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
        {!options.thumbnailOnly && (
          <span className={styles.productImageCardMeta}>
            <span className={styles.productImageCardTitle}>{title}</span>
            <span className={styles.productImageCardHint}>
              <CollectionsOutlinedIcon aria-hidden="true" />
              {mainImage ? `${images.length} photos · View` : "No photos"}
            </span>
          </span>
        )}
      </button>
      <OpsModalDialog
        onClose={() => setOpen(false)}
        open={open}
        maxWidth="lg"
        title={title}
        subtitle={activeVariant?.label ? `Photos for ${activeVariant.label}` : "Product image gallery"}
        closeButtonLabel="Close image gallery"
        classNames={{
          title: styles.productImageDialogName,
          subtitle: styles.productImageDialogSubtitle,
          content: styles.productImageDialogContent,
        }}
      >
        {open && (
          <>
            {imageVariants.length > 1 && (
              <div aria-label="Choose product variant photos" className={styles.imageVariantPicker}>
                <span className={styles.imageVariantPickerLabel}>Photos by variant</span>
                <div className={styles.imageVariantPickerOptions}>
                  {imageVariants.map((variant) => (
                    <button
                      aria-pressed={activeVariant?.id === variant.id}
                      className={`${styles.imageVariantOption} ${activeVariant?.id === variant.id ? styles.imageVariantOptionActive : ""}`}
                      key={variant.id}
                      onClick={() => setActiveVariantId(variant.id)}
                      type="button"
                    >
                      <span>{variant.label}</span>
                      <span className={styles.imageVariantPhotoCount}>{variant.images.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ProductImageCarousel
              key={activeVariant?.id ?? "product-images"}
              images={galleryImages}
              fallbackLetter={activeVariant?.fallbackLetter ?? fallbackLetter}
            />
          </>
        )}
      </OpsModalDialog>
    </div>
  );
}
