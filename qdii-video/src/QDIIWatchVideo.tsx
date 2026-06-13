import { AbsoluteFill, Sequence } from "remotion";
import "./FontLoader"; // Load Chinese font before rendering
import { SceneOpening } from "./scenes/SceneOpening";
import { SceneProblem } from "./scenes/SceneProblem";
import { SceneSolution } from "./scenes/SceneSolution";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { SceneFeatures } from "./scenes/SceneFeatures";
import { SceneSubscribe } from "./scenes/SceneSubscribe";
import { SceneClosing } from "./scenes/SceneClosing";

// Scene timings (in frames, 30fps)
const SCENES = {
  opening:    { from: 0,    duration: 240  }, // 0-8s
  problem:    { from: 240,  duration: 360  }, // 8-20s
  solution:   { from: 600,  duration: 450  }, // 20-35s
  dashboard:  { from: 1050, duration: 750  }, // 35-60s
  features:   { from: 1800, duration: 600  }, // 60-80s
  subscribe:  { from: 2400, duration: 600  }, // 80-100s
  closing:    { from: 3000, duration: 600  }, // 100-120s
};

export const QDIIWatchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <Sequence from={SCENES.opening.from} durationInFrames={SCENES.opening.duration}>
        <SceneOpening />
      </Sequence>
      <Sequence from={SCENES.problem.from} durationInFrames={SCENES.problem.duration}>
        <SceneProblem />
      </Sequence>
      <Sequence from={SCENES.solution.from} durationInFrames={SCENES.solution.duration}>
        <SceneSolution />
      </Sequence>
      <Sequence from={SCENES.dashboard.from} durationInFrames={SCENES.dashboard.duration}>
        <SceneDashboard />
      </Sequence>
      <Sequence from={SCENES.features.from} durationInFrames={SCENES.features.duration}>
        <SceneFeatures />
      </Sequence>
      <Sequence from={SCENES.subscribe.from} durationInFrames={SCENES.subscribe.duration}>
        <SceneSubscribe />
      </Sequence>
      <Sequence from={SCENES.closing.from} durationInFrames={SCENES.closing.duration}>
        <SceneClosing />
      </Sequence>
    </AbsoluteFill>
  );
};
