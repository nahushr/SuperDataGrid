import React, { useCallback, useEffect, useRef, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { toDisplayValue } from "../../utils/gridData";
import styles from "../../styles/predefined-cells.module.css";

export interface RenderLongCellItemProps {
  value: string;
  /** Wrap the complete value instead of truncating it with an ellipsis. */
  wrap?: boolean;
  className?: string;
}

export function RenderLongCellItem({ value, wrap = false, className }: RenderLongCellItemProps) {
  const text = toDisplayValue(value);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const measure = useCallback(() => {
    const element = textRef.current;
    if (!element || wrap) {
      setIsOverflowing(false);
      return;
    }
    setIsOverflowing(element.scrollWidth > element.clientWidth);
  }, [wrap]);

  useEffect(() => {
    measure();
    const element = textRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure, text]);

  return (
    <Tooltip title={!wrap && isOverflowing ? text : ""} arrow placement="top">
      <span
        ref={textRef}
        className={`${styles.longText} ${wrap ? styles.longTextWrapped : ""} ${className ?? ""}`.trim()}
      >
        {text}
      </span>
    </Tooltip>
  );
}

export default RenderLongCellItem;
