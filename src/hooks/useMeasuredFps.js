import { useEffect, useState } from "react";

/** Real render FPS via requestVideoFrameCallback (returns 0 if unsupported). */
export function useMeasuredFps(videoRef, active) {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !("requestVideoFrameCallback" in video)) {
      setFps(0);
      return undefined;
    }
    let frames = 0;
    let last = performance.now();
    let handle;
    const onFrame = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      handle = video.requestVideoFrameCallback(onFrame);
    };
    handle = video.requestVideoFrameCallback(onFrame);
    return () => video.cancelVideoFrameCallback?.(handle);
  }, [videoRef, active]);

  return fps;
}
