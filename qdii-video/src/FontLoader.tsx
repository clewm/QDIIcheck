import { continueRender, delayRender } from "remotion";
import { loadFont, fontFamily } from "@remotion/google-fonts/NotoSansSC";

export const FONT_FAMILY = fontFamily;

const handle = delayRender("Loading Chinese font...");

// Load multiple subsets to cover all Chinese characters
const { waitUntilDone } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["[4]", "[5]", "[6]", "[21]", "[22]", "[23]", "[24]", "[25]", "[26]", "[27]", "[28]", "[29]", "[30]", "[31]", "[32]", "[33]", "[34]", "[35]"],
  ignoreTooManyRequestsWarning: true,
});

waitUntilDone().then(() => {
  continueRender(handle);
}).catch(() => {
  continueRender(handle);
});
