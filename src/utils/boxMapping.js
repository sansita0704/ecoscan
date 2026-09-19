/**
 * Geometry for drawing model boxes over media rendered with `object-fit`.
 *
 * The model sees the full camera frame, but the element shows a centred crop of
 * it whenever the frame and the element disagree on aspect ratio. Treating
 * normalised box coordinates as percentages of the element ignores that crop,
 * which slides every box off its object (a 4:3 webcam in a 16:9 card is off by
 * ~10% of the element height).
 */

/**
 * Replicate `object-fit: cover` or `contain`: preserve aspect ratio and centre
 * the complete media inside the container. Uploads use `contain` so the source
 * image is never cropped; the live camera keeps using `cover`.
 */
export function computeViewport(
  containerWidth,
  containerHeight,
  frameWidth,
  frameHeight,
  fit = "cover"
) {
  if (!containerWidth || !containerHeight || !frameWidth || !frameHeight) return null;

  const scale = (fit === "contain" ? Math.min : Math.max)(
    containerWidth / frameWidth,
    containerHeight / frameHeight
  );
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  return {
    width: containerWidth,
    height: containerHeight,
    displayWidth,
    displayHeight,
    offsetX: (containerWidth - displayWidth) / 2,
    offsetY: (containerHeight - displayHeight) / 2,
  };
}

/**
 * Convert a normalised (0..1) frame box into container pixels.
 * `mirrored` flips the x axis: the preview is mirrored for the viewer while the
 * frames sent to the model are not, so the box must be flipped back to stay on
 * the object.
 */
export function mapBoxToViewport(box, viewport, mirrored = false) {
  const { width, displayWidth, displayHeight, offsetX, offsetY } = viewport;
  const left = offsetX + box.x * displayWidth;
  const boxWidth = box.w * displayWidth;

  return {
    left: mirrored ? width - (left + boxWidth) : left,
    top: offsetY + box.y * displayHeight,
    width: boxWidth,
    height: box.h * displayHeight,
  };
}
