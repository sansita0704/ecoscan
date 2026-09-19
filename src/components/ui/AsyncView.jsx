import { RefreshCw, WifiOff } from "lucide-react";
import Button from "./Button";
import EmptyState from "./EmptyState";

/**
 * Renders loading / error / data states for a `useAsyncData` query.
 * Usage: <AsyncView query={query} skeletonClassName="h-40">{(data) => ...}</AsyncView>
 */
export default function AsyncView({ query, skeletonClassName = "h-40", children }) {
  const { data, error, loading, reload } = query;

  if (error) {
    return (
      <div role="alert">
        <EmptyState
          icon={WifiOff}
          tone="danger"
          title="Couldn't load this"
          body="The backend didn't respond. Check that it's running, then try again."
        />
        <div className="flex justify-center pb-2">
          <Button onClick={reload} icon={RefreshCw} variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div
        role="status"
        aria-label="Loading"
        className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${skeletonClassName}`}
      >
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </div>
    );
  }

  // `loading && data` keeps the previous render on screen during a reload.
  return data ? children(data) : null;
}
