import React, { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { SuperDataGridProductImage } from "../../types";
import styles from "../../styles/predefined-cells.module.css";

export interface ProductImageCarouselProps {
  images: readonly SuperDataGridProductImage[];
  fallbackLetter?: string;
}

/** Large, keyboard-friendly product gallery with a selectable thumbnail strip. */
export default function ProductImageCarousel({
  images,
  fallbackLetter = "P",
}: Readonly<ProductImageCarouselProps>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const currentIndex = Math.max(0, Math.min(selectedIndex, images.length - 1));
  const currentImage = images[currentIndex];

  if (!currentImage) {
    return (
      <div className={styles.carouselEmpty}>
        <span className={styles.carouselEmptyMonogram}>{fallbackLetter}</span>
        <span>No product images</span>
      </div>
    );
  }

  const selectPrevious = () => {
    setSelectedIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  };
  const selectNext = () => {
    setSelectedIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  };
  const showPrevious = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    selectPrevious();
  };
  const showNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    selectNext();
  };
  const handleKeyboardNavigation = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (images.length < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      selectNext();
    }
  };
  const markFailed = (url: string) => {
    setFailedImages((current) => new Set(current).add(url));
  };
  const currentLabel = currentImage.label || `Image ${currentIndex + 1}`;

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselToolbar}>
        <div aria-live="polite" className={styles.carouselInfo} role="status">
          <span className={styles.carouselCounter}>
            {String(currentIndex + 1).padStart(2, "0")}
            <span className={styles.carouselCounterDivider}>/</span>
            {String(images.length).padStart(2, "0")}
          </span>
          <span className={styles.carouselLabel}>{currentLabel}</span>
        </div>
        {images.length > 1 && (
          <span className={styles.carouselKeyboardHint}>Use ← → to browse</span>
        )}
      </div>
      <div className={styles.carouselMain}>
        <div className={styles.carouselImageFrame}>
          {failedImages.has(currentImage.url) ? (
            <div className={styles.carouselImageFallback}>{fallbackLetter}</div>
          ) : (
            <img
              alt={currentImage.alt || currentLabel}
              className={styles.carouselImage}
              decoding="async"
              onError={() => markFailed(currentImage.url)}
              src={currentImage.url}
            />
          )}
          {images.length > 1 && (
            <span className={styles.carouselStageCount}>
              {currentIndex + 1} of {images.length}
            </span>
          )}
        </div>
        <button
          aria-label="Previous product image"
          className={`${styles.carouselNav} ${styles.carouselNavPrevious}`}
          disabled={images.length < 2}
          onClick={showPrevious}
          onKeyDown={handleKeyboardNavigation}
          type="button"
        >
          <ChevronLeftIcon />
        </button>
        <button
          aria-label="Next product image"
          className={`${styles.carouselNav} ${styles.carouselNavNext}`}
          disabled={images.length < 2}
          onClick={showNext}
          onKeyDown={handleKeyboardNavigation}
          type="button"
        >
          <ChevronRightIcon />
        </button>
      </div>
      {images.length > 1 && (
        <div aria-label="Product image thumbnails" className={styles.carouselThumbnails}>
          {images.map((image, index) => {
            const imageLabel = image.label || `image ${index + 1}`;
            const isActive = index === currentIndex;
            return (
              <button
                aria-label={`Show ${imageLabel}`}
                aria-pressed={isActive}
                className={`${styles.carouselThumbnail} ${isActive ? styles.carouselThumbnailActive : ""}`}
                key={`${image.url}-${index}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedIndex(index);
                }}
                onKeyDown={handleKeyboardNavigation}
                type="button"
              >
                {failedImages.has(image.url) ? (
                  <span className={styles.carouselThumbnailFallback}>
                    {fallbackLetter}
                  </span>
                ) : (
                  <img
                    alt=""
                    className={styles.carouselThumbnailImage}
                    loading="lazy"
                    onError={() => markFailed(image.url)}
                    src={image.url}
                  />
                )}
                <span className={styles.carouselThumbnailLabel}>{imageLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
