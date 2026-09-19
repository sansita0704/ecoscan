/**
 * Snapshot the current video frame as a JPEG Blob.
 * - `mirror`: flip horizontally (for user-facing captures that match the preview).
 * - `maxWidth`: downscale before encoding (use for model input to cut latency).
 * Returns null if the video has no frame yet.
 */
export function grabFrame(video, { mirror = false, maxWidth, quality = 0.85 } = {}) {
  if (!video || !video.videoWidth) return Promise.resolve(null);

  const scale = maxWidth ? Math.min(1, maxWidth / video.videoWidth) : 1;
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, width, height);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}
