import { useEffect, useState } from "react";
import { computeViewport } from "../utils/boxMapping";

const EPSILON = 0.5;

/**
 * Image sibling of useVideoViewport: maps the uploaded photo's own pixel
 * coordinates onto the container's displayed pixel box, accounting for
 * `object-fit: cover` cropping the same way the live feed does.
 *
 * Kept as its own hook rather than generalising useVideoViewport in place -
 * that hook is relied on by the live detection path, and this file existing
 * separately is what keeps the image-upload feature from touching it.
 */
export function useImageViewport(imgRef, containerRef, active) {
  const [viewport, setViewport] = useState(null);

  useEffect(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!active || !img || !container) {
      setViewport(null);
      return undefined;
    }

    const measure = () => {
      const next = computeViewport(
        container.clientWidth,
        container.clientHeight,
        img.naturalWidth,
        img.naturalHeight
      );
      if (!next) {
        setViewport(null);
        return;
      }

      setViewport((prev) => {
        const unchanged =
          prev && Object.keys(next).every((k) => Math.abs(prev[k] - next[k]) < EPSILON);
        return unchanged ? prev : next;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    img.addEventListener("load", measure);

    return () => {
      observer.disconnect();
      img.removeEventListener("load", measure);
    };
  }, [imgRef, containerRef, active]);

  return viewport;
}
