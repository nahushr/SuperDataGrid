import React, { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { SuperDataGridProductImage } from "../../types";
import styles from "../../styles/predefined-cells.module.css";

export interface ProductImageCarouselProps {
  images: readonly SuperDataGridProductImage[];
  fallbackLetter?: string;
}

/** Full-size product gallery matching SimpliShelf's data-grid image carousel. */
export default function ProductImageCarousel({
  images,
  fallbackLetter = "P",
}: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const currentImage = images[currentIndex];
  if (!currentImage) {
    return (
      <div className={styles.carouselEmpty}>
        <span>{fallbackLetter}</span>
        <span>No product images</span>
      </div>
    );
  }

  const showPrevious = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setCurrentIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  };
  const showNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setCurrentIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  };
  const markFailed = (url: string) => {
    setFailedImages((current) => new Set(current).add(url));
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselMain}>
        <button
          aria-label="Previous product image"
          className={styles.carouselNav}
          disabled={images.length < 2}
          onClick={showPrevious}
          type="button"
        >
          <ChevronLeftIcon />
        </button>
        <div className={styles.carouselImageFrame}>
          {failedImages.has(currentImage.url) ? (
            <div className={styles.carouselImageFallback}>{fallbackLetter}</div>
          ) : (
            <img
              alt={currentImage.label || `Product image ${currentIndex + 1}`}
              className={styles.carouselImage}
              onError={() => markFailed(currentImage.url)}
              src={currentImage.url}
            />
          )}
        </div>
        <button
          aria-label="Next product image"
          className={styles.carouselNav}
          disabled={images.length < 2}
          onClick={showNext}
          type="button"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div aria-live="polite" className={styles.carouselInfo}>
        {images.length > 1 && (
          <span className={styles.carouselCounter}>
            {currentIndex + 1}/{images.length}
          </span>
        )}
        {currentImage.label && (
          <span className={styles.carouselLabel}>{currentImage.label}</span>
        )}
      </div>
      {images.length > 1 && (
        <div aria-label="Product image thumbnails" className={styles.carouselThumbnails}>
          {images.map((image, index) => (
            <button
              aria-label={`Show ${image.label || `image ${index + 1}`}`}
              aria-pressed={index === currentIndex}
              className={`${styles.carouselThumbnail} ${index === currentIndex ? styles.carouselThumbnailActive : ""}`}
              key={`${image.url}-${index}`}
              onClick={(event) => {
                event.stopPropagation();
                setCurrentIndex(index);
              }}
              type="button"
            >
              <img
                alt=""
                className={styles.carouselThumbnailImage}
                onError={() => markFailed(image.url)}
                src={image.url}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
