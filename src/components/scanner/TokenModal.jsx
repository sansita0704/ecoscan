import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import QrGlyph from "./QrGlyph";

export default function TokenModal({ token, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-pop-in rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-500/35 bg-success-500/12 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-success-400">
            <Check size={11} strokeWidth={3} aria-hidden="true" />
            Ready
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2 id="token-title" className="mt-3 text-lg font-bold text-slate-800">
          Disposal token
        </h2>

        <div className="mt-4 flex justify-center">
          <QrGlyph value={token} />
        </div>

        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold tracking-wider text-brand-600">
          {token}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Scan this at any partner bin to log the drop-off and earn EcoPoints.
        </p>
      </div>
    </div>
  );
}
