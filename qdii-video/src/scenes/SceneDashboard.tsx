import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
  staticFile,
} from "remotion";
import { colors, fonts } from "../styles";

const statusItems = [
  { label: "不限额", color: colors.green, bg: colors.greenLight, count: "128" },
  { label: "限额", color: colors.amber, bg: colors.amberLight, count: "285" },
  { label: "暂停买入", color: colors.red, bg: colors.redLight, count: "52" },
];

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [710, 750], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Top section - title and status legend */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 120,
          right: 120,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        {/* Title area */}
        <div>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 600,
              fontSize: 16,
              color: colors.primary,
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 12,
              opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            DASHBOARD
          </div>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 40,
              color: colors.text,
              opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${interpolate(frame, [15, 35], [20, 0], { extrapolateRight: "clamp" })}px)`,
            }}
          >
            全市场 QDII 基金一目了然
          </div>
        </div>

        {/* Status legend */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {statusItems.map((s, i) => {
            const delay = 50 + i * 20;
            const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
              extrapolateRight: "clamp",
            });
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 10, mass: 0.5 },
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity,
                  transform: `scale(${Math.min(scale, 1)})`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: s.color,
                  }}
                />
                <span
                  style={{
                    fontFamily: fonts.sans,
                    fontWeight: 600,
                    fontSize: 16,
                    color: s.color,
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontWeight: 700,
                    fontSize: 16,
                    color: colors.textMuted,
                    backgroundColor: s.bg,
                    padding: "2px 10px",
                    borderRadius: 6,
                  }}
                >
                  {s.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screenshot with scroll animation */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
          bottom: 50,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.03)",
          opacity: interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Img
          src={staticFile("screenshots/dashboard-full.png")}
          style={{
            width: "100%",
            objectFit: "cover",
            objectPosition: "top",
            // Slow scroll effect
            transform: `translateY(-${interpolate(frame, [80, 650], [0, 600], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        />
      </div>

      {/* Floating highlight overlays at different times */}
      {/* Highlight 1: Search bar */}
      <HighlightBox
        frame={frame}
        startFrame={120}
        endFrame={250}
        top={175}
        left={90}
        width={500}
        height={52}
        label="全文搜索"
      />

      {/* Highlight 2: Filter buttons */}
      <HighlightBox
        frame={frame}
        startFrame={260}
        endFrame={390}
        top={240}
        left={90}
        width={900}
        height={48}
        label="多维筛选与排序"
      />

      {/* Highlight 3: Fund cards */}
      <HighlightBox
        frame={frame}
        startFrame={400}
        endFrame={550}
        top={360}
        left={90}
        width={1760}
        height={220}
        label="基金卡片：状态、限额、收益一目了然"
      />
    </AbsoluteFill>
  );
};

// Highlight box component
const HighlightBox: React.FC<{
  frame: number;
  startFrame: number;
  endFrame: number;
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
}> = ({ frame, startFrame, endFrame, top, left, width, height, label }) => {
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 15, endFrame - 15, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame: frame - startFrame,
    fps: 30,
    config: { damping: 12, mass: 0.5 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        border: `3px solid ${colors.primary}`,
        borderRadius: 14,
        opacity,
        transform: `scale(${Math.min(scale, 1)})`,
        boxShadow: `0 0 0 4px ${colors.primaryLight}`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -36,
          left: 0,
          backgroundColor: colors.primary,
          color: colors.white,
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 14,
          padding: "5px 14px",
          borderRadius: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
};
