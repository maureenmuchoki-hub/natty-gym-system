export default function Logo({ size = "md" }) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-2xl" },
    lg: { icon: 44, text: "text-4xl" },
  };
  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bar */}
        <rect x="10" y="18" width="20" height="4" rx="1" fill="var(--ng-accent)" />
        {/* Left plates */}
        <rect x="4" y="12" width="5" height="16" rx="1.5" fill="var(--ng-accent)" />
        <rect x="1" y="15" width="3" height="10" rx="1" fill="var(--ng-accent)" opacity="0.7" />
        {/* Right plates */}
        <rect x="31" y="12" width="5" height="16" rx="1.5" fill="var(--ng-accent)" />
        <rect x="36" y="15" width="3" height="10" rx="1" fill="var(--ng-accent)" opacity="0.7" />
      </svg>
      <span className={`font-display ${text} text-[var(--ng-accent)] leading-none`}>
        NATTY GYM
      </span>
    </div>
  );
}