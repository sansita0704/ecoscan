const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-glow hover:bg-brand-500 active:bg-brand-700 disabled:shadow-none",
  secondary: "hairline bg-white/[0.06] text-slate-100 hover:bg-white/[0.11] hover:border-white/20",
  ghost: "text-slate-300 hover:bg-white/[0.07] hover:text-white",
  danger: "border border-danger-500/40 bg-danger-500/12 text-danger-400 hover:bg-danger-500/20",
  success: "bg-success-600 text-white hover:bg-success-500",
};

const SIZES = {
  sm: "gap-1.5 rounded-lg px-3 py-1.5 text-sm",
  md: "gap-2 rounded-xl px-4 py-2.5 text-sm",
  lg: "gap-2.5 rounded-xl px-6 py-3 text-base",
};

/**
 * Shared button. Renders an <a> when `href` is passed so links stay links.
 * `icon` is decorative; `label` (or children) always carries the accessible name.
 */
export default function Button({
  as,
  href,
  icon: Icon,
  iconRight: IconRight,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  const Tag = as ?? (href ? "a" : "button");
  const isButton = Tag === "button";

  return (
    <Tag
      href={href}
      {...(isButton ? { type: rest.type ?? "button" } : {})}
      className={`inline-flex items-center justify-center font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === "lg" ? 18 : 16} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight size={size === "lg" ? 18 : 16} aria-hidden="true" />}
    </Tag>
  );
}
