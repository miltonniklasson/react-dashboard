type SpinnerSize = "sm" | "md" | "lg" | number;

interface SpinnerProps {
  size?: SpinnerSize; // preset or explicit px number
  label?: string; // accessible label
  inline?: boolean; // if true, don't add centering wrapper spacing
  className?: string;
}

/**
 * Accessible animated spinner.
 * - Uses CSS border animation (no extra assets)
 * - Respects reduced motion
 */
export function Spinner({
  size = "md",
  label = "Loading…",
  inline = false,
  className = "",
}: SpinnerProps) {
  // Base sizes expressed in rem so they track root scaling.
  const px =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 16 /* 1rem */
      : size === "lg"
      ? 40 /* 2.5rem */
      : 28; /* 1.75rem default */
  const spinner = (
    <span
      className={`spinner ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{ ["--_sp-size" as any]: `${px / 16}rem` }}
    >
      <span className="visually-hidden">{label}</span>
    </span>
  );
  if (inline) return spinner;
  return (
    <div className="spinner-wrap" aria-hidden={false}>
      {spinner}
    </div>
  );
}

export default Spinner;
