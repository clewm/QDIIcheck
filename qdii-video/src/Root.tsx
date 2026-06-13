import { Composition } from "remotion";
import { QDIIWatchVideo } from "./QDIIWatchVideo";

export const Root: React.FC = () => {
  return (
    <Composition
      id="QDIIWatchVideo"
      component={QDIIWatchVideo}
      durationInFrames={3600}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
