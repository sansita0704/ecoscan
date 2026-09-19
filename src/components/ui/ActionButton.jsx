export default function ActionButton({ icon: Icon, label, onClick, active = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-brand-500/40 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
