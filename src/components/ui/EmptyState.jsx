import Button from "./Button";

/**
 * Shared empty / no-result state. `tone` tints the icon halo so a neutral
 * "nothing yet" reads differently from a warning without relying on colour
 * alone - the title and body always carry the meaning.
 */
const TONES = {
  neutral: "border-slate-200 bg-slate-50 text-slate-400",
  brand: "border-brand-200 bg-brand-50 text-brand-500",
  tech: "border-blue-200 bg-blue-50 text-blue-500",
  warn: "border-amber-200 bg-amber-50 text-amber-500",
  danger: "border-red-200 bg-red-50 text-danger-500",
};

export default function EmptyState({
  icon: Icon,
  title,
  body,
  tone = "neutral",
  action,
  onAction,
  actionIcon,
  className = "",
  children,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-10 text-center ${className}`}
    >
      {Icon && (
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${TONES[tone]}`}
        >
          <Icon size={24} aria-hidden="true" />
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        {body && <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-500">{body}</p>}
      </div>
      {action && onAction && (
        <Button onClick={onAction} icon={actionIcon} variant="secondary" size="sm">
          {action}
        </Button>
      )}
      {children}
    </div>
  );
}
