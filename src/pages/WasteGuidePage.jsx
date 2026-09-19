import { useCallback, useState } from "react";
import { BookOpen, Info } from "lucide-react";
import WasteCategoryCard from "../components/guide/WasteCategoryCard";
import AsyncView from "../components/ui/AsyncView";
import Card from "../components/ui/Card";
import { BINS, MATERIAL_LIST } from "../config/wasteTaxonomy";
import { useAsyncData } from "../hooks/useAsyncData";
import { getWasteRules } from "../services/wasteRulesService";
import PageHeader from "../components/layout/PageHeader";

function BinLegend() {
  return (
    <Card className="p-5">
      <h2 className="text-label">Bin system</h2>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {[BINS.recyclable, BINS.landfill, BINS.hazardous].map((bin) => {
          const Icon = bin.icon;
          return (
            <li
              key={bin.id}
              className={`flex items-start gap-2.5 rounded-xl border p-3 ${bin.border} ${bin.surface}`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${bin.text}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{bin.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{bin.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function WasteGuidePage({ stats }) {
  const query = useAsyncData(getWasteRules);
  const [open, setOpen] = useState(null);

  const toggle = useCallback((id) => setOpen((cur) => (cur === id ? null : id)), []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        eyebrow="Reference"
        title="Waste guide"
        subtitle="The materials EcoScan can recognise, and where each one belongs."
      />

      <BinLegend />

      <AsyncView query={query} skeletonClassName="h-64">
        {({ rules }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            {MATERIAL_LIST.map((material) => (
              <WasteCategoryCard
                key={material.id}
                material={material}
                count={stats.byMaterial[material.id] ?? 0}
                expanded={open === material.id}
                onToggle={() => toggle(material.id)}
                ruleFor={(className) => rules[className]}
              />
            ))}
          </div>
        )}
      </AsyncView>

      <Card variant="inset" className="flex items-start gap-3 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-slate-400">
          The detection model recognises twenty-two specific object classes. Material families and bin
          mappings shown here come from the configured disposal rules, not from the model. Items
          outside those classes won't be detected.
        </p>
      </Card>
    </div>
  );
}
