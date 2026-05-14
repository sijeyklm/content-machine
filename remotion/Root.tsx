import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import { AdSpot } from "./compositions/AdSpot";
import brandRules from "../public/samples/cached/northbean-rules.json";

// Sample directive content from your brand brain output (Day 3d)
const TIKTOK_DIRECTIVE = {
  hook: "POV: you're trying three single-origins in three months",
  bodyCopy: "Ethiopian bergamot. Colombian caramel. Guatemalan citrus. 18-hour slow steep. Each one hits exactly right.",
  cta: "Link in bio",
};

const SHARED_PROPS = {
  ...TIKTOK_DIRECTIVE,
  productImageSrc: "/samples/product-shots/bottle.jpg",
  colors: {
    primary: brandRules.colors.primary,
    secondary: brandRules.colors.secondary,
    accent: brandRules.colors.accent,
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* TikTok / YouTube Shorts — vertical 9:16 */}
      <Composition
        id="AdSpot-9x16"
        component={AdSpot}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={SHARED_PROPS}
      />

      {/* Meta feed — square 1:1 */}
      <Composition
        id="AdSpot-1x1"
        component={AdSpot}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={SHARED_PROPS}
      />

      {/* Meta feed alternative — portrait 4:5 */}
      <Composition
        id="AdSpot-4x5"
        component={AdSpot}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={SHARED_PROPS}
      />
    </>
  );
};