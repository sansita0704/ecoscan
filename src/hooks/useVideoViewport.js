import { useEffect, useState } from "react";
import { computeViewport } from "../utils/boxMapping";

const EPSILON = 0.5;

/**
 * Maps the video's normalised frame coordinates onto the container's pixel box,
 * accounting for `object-fit: cover` cropping.
 *
 * The model sees the whole camera frame, but the element shows a centre-cropped
 * slice of it whenever the camera's aspect ratio differs from the container's
 * (a 4:3 webcam in a 16:9 card crops 25% of the height). Positioning boxes as a
 * percentage of the container ignores that crop and drifts them off the object.
 */
export function useVideoViewport(videoRef, containerRef, active) {
  const [viewport, setViewport] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!active || !video || !container) {
      setViewport(null);
      return undefined;
    }

    const measure = () => {
      const next = computeViewport(
        container.clientWidth,
        container.clientHeight,
        video.videoWidth,
        video.videoHeight
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
    video.addEventListener("loadedmetadata", measure);
    video.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", measure);
      video.removeEventListener("resize", measure);
    };
  }, [videoRef, containerRef, active]);

  return viewport;
}
