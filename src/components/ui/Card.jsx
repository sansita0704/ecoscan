const VARIANTS = {
  solid: "bg-white hairline shadow-card",
  // Slightly lifted surface for nested blocks inside a solid card.
  inset: "bg-[#F2F4F0] border border-slate-200/70",
  // Glass is reserved for overlays on top of imagery (camera feed, hero).
  glass: "bg-white/85 hairline shadow-card backdrop-blur-xl",
};

export default function Card({
  as: Tag = "section",
  variant = "solid",
  interactive = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={`rounded-2xl ${VARIANTS[variant]} ${
        interactive
          ? "transition duration-200 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-lift"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
