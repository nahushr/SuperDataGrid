import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import type { SuperDataGridImageOptions } from "../../types";
import { getProductImages } from "../../utils/predefinedCellData";
import ProductImageCarousel from "./ProductImageCarousel";
import styles from "../../styles/predefined-cells.module.css";

interface ImagePreviewCellProps {
  value: unknown;
  field?: string;
  options?: SuperDataGridImageOptions;
}

/** Product-grid tile which opens the complete image carousel on click. */
export default function ImagePreviewCell({
  value,
  field,
  options = {},
}: ImagePreviewCellProps) {
  const [open, setOpen] = useState(false);
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState("");
  const images = getProductImages(value, options);
  const mainImage =
    images.find((image) => image.label?.toLowerCase().includes("main")) ??
    images[0];
  const fallbackLetter = options.fallbackLetter?.slice(0, 1) || "P";
  const title = mainImage?.label || field || "Product images";

  return (
    <div className={styles.imageCell}>
      <button
        aria-label={mainImage ? `View ${images.length} product images` : "Product has no image"}
        className={`${styles.productImageTile} ${mainImage ? styles.productImageTileActive : ""}`}
        disabled={!mainImage}
        onClick={(event) => {
          event.stopPropagation();
          if (mainImage) setOpen(true);
        }}
        type="button"
      >
        {mainImage && failedThumbnailUrl !== mainImage.url ? (
          <img
            alt={mainImage.alt}
            className={styles.productImageThumbnail}
            onError={() => setFailedThumbnailUrl(mainImage.url)}
            src={mainImage.url}
          />
        ) : (
          <span className={styles.productImageFallback}>{fallbackLetter}</span>
        )}
      </button>
      {mainImage?.label && (
        <span className={styles.productImageLabel}>{mainImage.label}</span>
      )}
      <Dialog
        aria-label={`Image gallery: ${title}`}
        onClose={() => setOpen(false)}
        open={open}
        PaperProps={{ className: styles.productImageDialogPaper }}
      >
        <DialogContent className={styles.productImageDialogContent}>
          <ProductImageCarousel images={images} fallbackLetter={fallbackLetter} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
