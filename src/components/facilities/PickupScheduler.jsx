import { forwardRef, useCallback, useEffect, useState } from "react";
import { CalendarClock, Check, Loader2, Truck, X } from "lucide-react";
import { MATERIAL_LIST } from "../../config/wasteTaxonomy";
import { useGeolocation } from "../../hooks/useGeolocation";
import { cancelPickup, createPickup, getPickups } from "../../services/pickupService";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

const TIME_WINDOWS = ["09:00 - 12:00", "12:00 - 15:00", "15:00 - 18:00", "18:00 - 20:00"];

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  preferredDate: "",
  timeWindow: TIME_WINDOWS[0],
  wasteTypes: [],
  notes: "",
};

/** Today in the yyyy-mm-dd the date input wants, for the min= floor. */
function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

/** One already-scheduled request, with the option to call it off. */
function PickupRow({ pickup, onCancel, cancelling }) {
  const cancelled = pickup.status === "cancelled";
  return (
    <li className={`rounded-xl border p-3 ${cancelled ? "border-slate-200 bg-slate-50" : "border-success-500/35 bg-success-50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            {pickup.preferredDate} · {pickup.timeWindow}
            {cancelled ? (
              <Badge tone="zinc">Cancelled</Badge>
            ) : (
              <Badge tone="green">
                <Check size={11} aria-hidden="true" />
                Scheduled
              </Badge>
            )}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{pickup.address}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {pickup.name} · {pickup.phone} · ref {pickup.id}
          </p>
          {pickup.facilityName && (
            <p className="mt-0.5 text-xs text-slate-400">Destination: {pickup.facilityName}</p>
          )}
          {pickup.wasteTypes.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {pickup.wasteTypes.map((w) => (
                <li
                  key={w}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[0.625rem] text-slate-500"
                >
                  {w}
                </li>
              ))}
            </ul>
          )}
          {pickup.notes && <p className="mt-2 text-xs italic text-slate-500">“{pickup.notes}”</p>}
        </div>
        {!cancelled && (
          <Button
            onClick={() => onCancel(pickup.id)}
            disabled={cancelling}
            icon={cancelling ? undefined : X}
            variant="ghost"
            size="sm"
          >
            {cancelling && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Cancel
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Request a collection from the user's own address, for when getting to a
 * drop-off centre isn't practical.
 *
 * Deliberately honest about what this does: the request is recorded and
 * tracked (persisted by the backend), and a coordinator confirms it. There's
 * no courier dispatch integration behind this, so nothing here claims a van
 * is already on its way.
 */
const PickupScheduler = forwardRef(function PickupScheduler({ suggestedFacility }, ref) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [justScheduled, setJustScheduled] = useState(null);
  const { location } = useGeolocation();

  const refresh = useCallback(async () => {
    try {
      setPickups(await getPickups());
    } catch {
      // A failed list read shouldn't block scheduling a new one; the form
      // stays usable and the list just stays as it was.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleWasteType = (id) =>
    setForm((f) => ({
      ...f,
      wasteTypes: f.wasteTypes.includes(id)
        ? f.wasteTypes.filter((w) => w !== id)
        : [...f.wasteTypes, id],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createPickup({
        ...form,
        // Coordinates ride along only if the user already shared them, so a
        // collector has something better than a typed address to go on.
        lat: location.precise ? location.lat : null,
        lon: location.precise ? location.lon : null,
        facilityName: suggestedFacility ?? null,
      });
      setJustScheduled(created);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelPickup(id);
      await refresh();
      setJustScheduled((j) => (j?.id === id ? null : j));
    } catch (err) {
      setError(err);
    } finally {
      setCancellingId(null);
    }
  };

  const canSubmit =
    form.name.trim() && form.phone.trim() && form.address.trim() && form.preferredDate && !submitting;

  return (
    // The ref lives on a wrapper rather than on Card: Card is a plain
    // function component, so a ref passed to it would be dropped.
    <div ref={ref} className="scroll-mt-6">
      <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Truck size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-label">Schedule a pickup</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Can't get to a centre yourself? Request a collection from your address and we'll route
            it to the right facility.
          </p>
        </div>
      </div>

      {justScheduled && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-success-500/35 bg-success-50 p-3"
        >
          <Check size={15} className="mt-0.5 shrink-0 text-success-600" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-slate-600">
            Pickup <span className="font-semibold text-slate-800">{justScheduled.id}</span> requested
            for {justScheduled.preferredDate}, {justScheduled.timeWindow}. A coordinator will call{" "}
            {justScheduled.phone} to confirm.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Full name" required />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone}
              onChange={set("phone")}
              placeholder="Number to confirm on"
              type="tel"
              required
            />
          </Field>
        </div>

        <Field label="Pickup address" hint={location.precise ? "Your shared location will be attached to help the collector find you." : undefined}>
          <textarea
            className={`${inputClass} min-h-[4.5rem] resize-y`}
            value={form.address}
            onChange={set("address")}
            placeholder="Flat / house, street, area, landmark"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred date">
            <input
              className={inputClass}
              type="date"
              min={todayIso()}
              value={form.preferredDate}
              onChange={set("preferredDate")}
              required
            />
          </Field>
          <Field label="Time window">
            <select className={inputClass} value={form.timeWindow} onChange={set("timeWindow")}>
              {TIME_WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <span className="text-label">What's being collected?</span>
          <ul className="mt-2 flex flex-wrap gap-2">
            {MATERIAL_LIST.map((m) => {
              const selected = form.wasteTypes.includes(m.name);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggleWasteType(m.name)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: m.tint }}
                    />
                    {m.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <Field label="Notes (optional)">
          <input
            className={inputClass}
            value={form.notes}
            onChange={set("notes")}
            placeholder="Gate code, floor, how many bags…"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger-500">
            Couldn't schedule that. {error.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!canSubmit} icon={submitting ? undefined : CalendarClock}>
            {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Request pickup
          </Button>
          <p className="text-xs text-slate-400">
            Recorded and tracked here — a coordinator confirms before anyone travels.
          </p>
        </div>
      </form>

      {pickups.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-label">Your pickups</h3>
          <ul className="mt-3 space-y-2">
            {pickups.map((p) => (
              <PickupRow key={p.id} pickup={p} onCancel={onCancel} cancelling={cancellingId === p.id} />
            ))}
          </ul>
        </div>
      )}
      </Card>
    </div>
  );
});

export default PickupScheduler;
