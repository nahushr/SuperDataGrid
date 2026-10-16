import React from "react";
import ImagePreviewCell from "./ImagePreviewCell";
import type {
  SuperDataGridImageDetailsValue,
  SuperDataGridImageOptions,
} from "../../types";
import { asRecord } from "../../utils/predefinedCellData";
import styles from "../../styles/predefined-cells.module.css";

interface ImageDetailsCellProps {
  value: unknown;
  field: string;
  options?: SuperDataGridImageOptions;
}

function toTextList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

/** Shows an image gallery thumbnail and its descriptive content in one cell. */
export default function ImageDetailsCell({
  value,
  field,
  options,
}: Readonly<ImageDetailsCellProps>) {
  const details = asRecord(value) as SuperDataGridImageDetailsValue | null;
  const title = typeof details?.title === "string" ? details.title.trim() : "";
  const description = typeof details?.description === "string"
    ? details.description.trim()
    : "";
  const badges = toTextList(details?.badges);
  const metadata = toTextList(details?.metadata);

  if (!title && !description && badges.length === 0 && metadata.length === 0) {
    return <span className={styles.emptyValue}>—</span>;
  }

  return (
    <div className={styles.imageDetailsCell}>
      <ImagePreviewCell
        value={details?.images ?? []}
        imageVariants={details?.imageVariants ?? []}
        field={field}
        row={{ title }}
        options={{ ...options, titleField: "title", thumbnailOnly: true }}
      />
      <div className={styles.imageDetailsContent}>
        <span className={styles.imageDetailsTitle} title={title}>
          {title || "—"}
        </span>
        {description && (
          <span className={styles.imageDetailsDescription} title={description}>
            {description}
          </span>
        )}
        {badges.length > 0 && (
          <div className={styles.imageDetailsBadges}>
            {badges.map((badge) => (
              <span className={styles.imageDetailsBadge} key={badge}>{badge}</span>
            ))}
          </div>
        )}
        {metadata.length > 0 && (
          <div className={styles.imageDetailsMetadataList}>
            {metadata.map((item, index) => (
              <span className={styles.imageDetailsMetadata} key={`${item}-${index}`} title={item}>
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
