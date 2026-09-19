import { useCallback, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { useImageViewport } from "../../hooks/useImageViewport";
import ActionButton from "../ui/ActionButton";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import BoundingBox from "./BoundingBox";

/** Drop zone shown before any image has been picked. */
function DropZone({ dragOver, onPick, onDrop, onDragOver, onDragLeave }) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`absolute inset-0 flex items-center justify-center p-6 transition-colors ${
        dragOver ? "bg-brand-50" : ""
      }`}
    >
      <EmptyState
        icon={ImagePlus}
        tone="brand"
        title={dragOver ? "Drop to scan" : "Upload a photo of your waste"}
        body="Good for a poly bag or pile of items a live camera can't get a clean read on - a still photo, shot closer and steadier, often does better. JPEG or PNG, up to 8MB."
      >
        <Button onClick={onPick} icon={Upload} size="md">
          Choose image
        </Button>
      </EmptyState>
    </div>
  );
}

/**
 * Upload-and-detect counterpart to LiveStream: pick or drop a single photo,
 * see it immediately, and once detection finishes every item is boxed on
 * that same image - reusing BoundingBox exactly as the live feed does, just
 * mapped through useImageViewport instead of useVideoViewport.
 *
 * Fully self-contained: the parent only needs the upload's `detection` (see
 * hooks/useImageDetection) to feed the shared item-list panel, so nothing
 * about the live camera path had to change for this to exist.
 */
export default function ImageUploadPanel({ status, previewUrl, detection, error, onSelectFile, onRetry, onClear }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const hasImage = status !== "idle" && (previewUrl || status === "error");
  const viewport = useImageViewport(imgRef, containerRef, !!previewUrl);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-picking the exact same file
      if (file) onSelectFile(file);
    },
    [onSelectFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onSelectFile(file);
    },
    [onSelectFile]
  );

  return (
    <Card className="overflow-hidden">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 sm:aspect-video"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Upload a waste photo"
        />

        {!hasImage && (
          <DropZone
            dragOver={dragOver}
            onPick={openPicker}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          />
        )}

        {previewUrl && (
          <>
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Uploaded waste"
              className="h-full w-full object-cover"
            />
            <BoundingBox detection={detection} mirrored={false} viewport={viewport} />

            <div className="absolute right-4 top-4">
              {status === "loading" && (
                <Badge tone="tech" className="!bg-white/90 backdrop-blur-sm">
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                  Detecting
                </Badge>
              )}
              {status === "ready" && (
                <Badge tone="green" className="!bg-white/90 backdrop-blur-sm">
                  {detection?.totalItems ?? 0} item{(detection?.totalItems ?? 0) === 1 ? "" : "s"} found
                </Badge>
              )}
            </div>
          </>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-6">
            <EmptyState icon={AlertTriangle} tone="danger" title="Couldn't process that image" body={error?.message}>
              <div className="flex gap-2">
                {previewUrl && (
                  <Button onClick={onRetry} icon={RefreshCw} variant="secondary" size="sm">
                    Try again
                  </Button>
                )}
                <Button onClick={openPicker} icon={Upload} size="sm">
                  Choose another
                </Button>
              </div>
            </EmptyState>
          </div>
        )}
      </div>

      {hasImage && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-200 p-4">
          <ActionButton icon={Upload} label="Choose another image" onClick={openPicker} />
          {status === "ready" && (
            <ActionButton icon={RefreshCw} label="Re-scan this image" onClick={onRetry} />
          )}
          <ActionButton icon={X} label="Clear" onClick={onClear} />
        </div>
      )}
    </Card>
  );
}
