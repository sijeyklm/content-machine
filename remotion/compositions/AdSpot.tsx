import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
});

export type AdSpotProps = {
  hook: string;
  bodyCopy: string;
  cta: string;
  productImageSrc: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

/**
 * Compute aspect-ratio-aware layout proportions.
 *
 * The same AdSpot component renders correctly across 9:16, 1:1, and 4:5
 * by deriving layout values from the canvas dimensions instead of using
 * hardcoded pixel values.
 */
const getLayout = (width: number, height: number) => {
  const aspectRatio = width / height;

  // Image takes more vertical space when canvas is taller (vertical),
  // less when canvas is wider (square or landscape-leaning).
  // 9:16 (0.5625) → 55%, 4:5 (0.8) → 50%, 1:1 (1.0) → 45%
  const imageHeightPct = interpolateLinear(aspectRatio, 0.56, 1.0, 0.55, 0.45);

  // Padding scales with canvas width (looks proportional at any size)
  const paddingHorizontal = Math.round(width * 0.075);
  const paddingVertical = Math.round(width * 0.055);

  // Font sizes scale with canvas width
  const hookFontSize = Math.round(width * 0.06);
  const bodyFontSize = Math.round(width * 0.028);
  const ctaFontSize = Math.round(width * 0.028);

  // Gap between text elements scales too
  const textGap = Math.round(width * 0.025);

  return {
    imageHeightPct,
    paddingHorizontal,
    paddingVertical,
    hookFontSize,
    bodyFontSize,
    ctaFontSize,
    textGap,
  };
};

/**
 * Plain linear interpolation between two ranges.
 * Different from Remotion's `interpolate` — this is a pure helper
 * for layout math at module level (no frame dependency).
 */
const interpolateLinear = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  const progress = (clamped - inMin) / (inMax - inMin);
  return outMin + progress * (outMax - outMin);
};

export const AdSpot: React.FC<AdSpotProps> = ({
  hook,
  bodyCopy,
  cta,
  productImageSrc,
  colors,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const layout = getLayout(width, height);

  // Animation values (unchanged from before)
  const imageOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const imageScale = interpolate(frame, [0, 30], [1.05, 1], {
    extrapolateRight: "clamp",
  });

  const hookOpacity = interpolate(frame, [25, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hookTranslateY = interpolate(frame, [25, 55], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bodyOpacity = interpolate(frame, [50, 80], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyTranslateY = interpolate(frame, [50, 80], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaSpring = spring({
    frame: frame - 70,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.secondary }}>
      {/* Product image area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${layout.imageHeightPct * 100}%`,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(productImageSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: imageOpacity,
            transform: `scale(${imageScale})`,
          }}
        />
      </div>

      {/* Gradient transition */}
      <div
        style={{
          position: "absolute",
          top: `${layout.imageHeightPct * 100 - 5}%`,
          left: 0,
          right: 0,
          height: "8%",
          background: `linear-gradient(to bottom, transparent, ${colors.secondary})`,
          pointerEvents: "none",
        }}
      />

      {/* Text content area */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${(1 - layout.imageHeightPct) * 100}%`,
          padding: `${layout.paddingVertical}px ${layout.paddingHorizontal}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: layout.textGap,
        }}
      >
        {/* Hook */}
        <div
          style={{
            fontFamily,
            color: colors.primary,
            fontSize: layout.hookFontSize,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            opacity: hookOpacity,
            transform: `translateY(${hookTranslateY}px)`,
          }}
        >
          {hook}
        </div>

        {/* Body copy */}
        <div
          style={{
            fontFamily,
            color: colors.primary,
            fontSize: layout.bodyFontSize,
            fontWeight: 400,
            lineHeight: 1.4,
            opacity: bodyOpacity,
            transform: `translateY(${bodyTranslateY}px)`,
          }}
        >
          {bodyCopy}
        </div>

        {/* CTA */}
        <div
          style={{
            fontFamily,
            backgroundColor: colors.accent,
            color: colors.secondary,
            fontSize: layout.ctaFontSize,
            fontWeight: 600,
            padding: `${Math.round(layout.ctaFontSize * 0.65)}px ${Math.round(layout.ctaFontSize * 1.15)}px`,
            borderRadius: 8,
            alignSelf: "flex-start",
            marginTop: Math.round(layout.textGap * 0.5),
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};