import React from "react";
import styles from "../styles/loading-overlay.module.css";

interface SuperDataGridLoadingOverlayProps {
  className?: string;
}

export default function SuperDataGridLoadingOverlay({
  className,
}: SuperDataGridLoadingOverlayProps) {
  return (
    <div
      className={`${className ?? ""} ${styles.overlay}`.trim()}
      role="status"
      aria-live="polite"
      aria-label="Fetching details"
    >
      <div className={styles.loaderCard}>
        <div className={styles.loaderMark} aria-hidden="true">
          <span className={styles.outerRing} />
          <span className={styles.innerRing} />
          <span className={styles.loaderCore} />
          <span className={styles.orbitDot} />
        </div>
        <div className={styles.message}>Fetching details</div>
        <div className={styles.description}>Loading this page of records</div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}
