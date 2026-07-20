// ════════════════════════════════════════════════════════════
// Autofy Logo — glossy speech-bubble mark with the signature
// pink→blue gradient. Pure inline SVG so it stays crisp at any size
// (navbar 16px → hero), needs no image asset, and works in both themes.
// ════════════════════════════════════════════════════════════
import { useId } from "react";

interface LogoProps {
  /** Rendered width/height in px (the mark is square-ish). Default 20. */
  size?: number;
  className?: string;
}

export function Logo({ size = 20, className }: LogoProps) {
  // Unique gradient ids so multiple logos on one page don't collide.
  const id = useId();
  const fill = `fill-${id}`;
  const gloss = `gloss-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 40"
      fill="none"
      className={className}
      role="img"
      aria-label="Autofy"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Pink → violet → blue, matching the brand gradient */}
        <linearGradient id={fill} x1="2" y1="2" x2="46" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EC4899" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        {/* Soft top highlight for a glossy, 3D feel */}
        <linearGradient id={gloss} x1="24" y1="4" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rounded speech bubble with a tail at the bottom-right */}
      <path
        d="M9 2h30a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7H26l-6.5 6.2a1 1 0 0 1-1.7-.72V30H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7z"
        fill={`url(#${fill})`}
      />
      {/* Glossy inner highlight */}
      <path
        d="M9 2h30a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7H26l-6.5 6.2a1 1 0 0 1-1.7-.72V30H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7z"
        fill={`url(#${gloss})`}
      />
    </svg>
  );
}

export default Logo;
