import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const HelloWorld = () => {
  const frame = useCurrentFrame();

  // Fade in over the first 30 frames (1 second at 30fps)
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slight upward slide as it appears
  const translateY = interpolate(frame, [0, 30], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F5EFE0",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          color: "#2B1810",
          fontSize: 80,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Northbean
      </div>
    </AbsoluteFill>
  );
};