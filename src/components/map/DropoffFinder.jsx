import { Clock, Navigation } from "lucide-react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getNearestHub } from "../../services/disposalService";
import AsyncView from "../ui/AsyncView";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import MapCanvas from "./MapCanvas";

export default function DropoffFinder() {
  const query = useAsyncData(getNearestHub);

  return (
    <Card className="overflow-hidden">
      <MapCanvas />
      <div className="p-5">
        <AsyncView query={query} skeletonClassName="h-16">
          {(hub) => (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-label">Nearest recycling hub</p>
                <h3 className="mt-1 text-lg font-bold text-white">{hub.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                  <Badge tone="brand">{hub.distanceKm} km away</Badge>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} aria-hidden="true" />
                    {hub.hours}
                  </span>
                </div>
              </div>
              <Button
                href={`https://www.google.com/maps/dir/?api=1&destination=${hub.lat},${hub.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                icon={Navigation}
              >
                Directions
              </Button>
            </div>
          )}
        </AsyncView>
      </div>
    </Card>
  );
}
