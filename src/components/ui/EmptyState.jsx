import Button from "./Button";

/**
 * Shared empty / no-result state. `tone` tints the icon halo so a neutral
 * "nothing yet" reads differently from a warning without relying on colour
 * alone - the title and body always carry the meaning.
 */
const TONES = {
  neutral: "border-white/10 bg-white/[0.04] text-slate-400",
  brand: "border-brand-500/30 bg-brand-500/10 text-brand-400",
  tech: "border-tech-400/30 bg-tech-400/10 text-tech-300",
  warn: "border-warn-500/30 bg-warn-500/10 text-warn-400",
  danger: "border-danger-500/30 bg-danger-500/10 text-danger-400",
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
        <p className="font-semibold text-white">{title}</p>
        {body && <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-400">{body}</p>}
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
