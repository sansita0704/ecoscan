import { MapPin } from "lucide-react";
import DropoffFinder from "../components/map/DropoffFinder";
import WasteIllustration from "../components/illustrations/WasteIllustration";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import { BINS } from "../config/wasteTaxonomy";

export default function FacilitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={MapPin}
        eyebrow="Drop-off"
        title="Nearby facilities"
        subtitle="Where to take items that can't go in a kerbside bin."
      />

      <DropoffFinder />

      <Card className={`flex flex-col gap-4 border p-4 sm:flex-row sm:items-center ${BINS.hazardous.border} ${BINS.hazardous.surface}`}>
        <WasteIllustration id="hazardous" tint="#D97706" className="h-24 w-24 shrink-0" />
        <div className="flex items-start gap-3">
          <BINS.hazardous.icon
            size={18}
            className={`mt-0.5 shrink-0 ${BINS.hazardous.text}`}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">Hazardous items need a staffed drop-off</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Broken glass and other sharps should be wrapped, labelled and handed over in person —
              never placed in a kerbside bin.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
