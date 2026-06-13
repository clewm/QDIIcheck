import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";

export const SceneClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const titleOpacity = interpolate(frame, [10, 35], [0, 1], { extrapolateRight: "clamp" });

  const urlOpacity = interpolate(frame, [60, 85], [0, 1], { extrapolateRight: "clamp" });
  const urlY = interpolate(frame, [60, 85], [20, 0], { extrapolateRight: "clamp" });

  const taglineOpacity = interpolate(frame, [100, 125], [0, 1], { extrapolateRight: "clamp" });

  const authorOpacity = interpolate(frame, [150, 175], [0, 1], { extrapolateRight: "clamp" });

  // Background glow
  const glowOpacity = interpolate(frame, [30, 60], [0, 0.06], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.white,
        opacity: fadeIn,
        overflow: "hidden",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          backgroundColor: colors.primary,
          opacity: glowOpacity,
          filter: "blur(120px)",
        }}
      />

      {/* Status dots row - decorative */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {[colors.green, colors.amber, colors.red, colors.green, colors.amber].map((c, i) => {
          const dotScale = spring({
            frame: frame - i * 8,
            fps,
            config: { damping: 8, mass: 0.4 },
          });
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: c,
                transform: `scale(${Math.max(0, dotScale)})`,
              }}
            />
          );
        })}
      </div>

      {/* Main title */}
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `scale(${Math.min(titleScale, 1)})`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 72,
            color: colors.text,
            letterSpacing: -2,
          }}
        >
          QDII Watch
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          top: 370,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontFamily: fonts.mono,
            fontWeight: 600,
            fontSize: 32,
            color: colors.primary,
            padding: "16px 40px",
            borderRadius: 16,
            backgroundColor: colors.primaryLight,
            border: `2px solid ${colors.primary}20`,
          }}
        >
          qdii.hulab.top
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: taglineOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 500,
            fontSize: 24,
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          每日自动监控 QDII 基金申购限额
          <br />
          免费使用 · 无需注册 · 支持邮件订阅
        </div>
      </div>

      {/* Feature pills */}
      <div
        style={{
          position: "absolute",
          top: 580,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          opacity: interpolate(frame, [130, 155], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {["自动采集", "状态监控", "限额追踪", "邮件推送"].map((t, i) => (
          <div
            key={i}
            style={{
              fontFamily: fonts.sans,
              fontWeight: 500,
              fontSize: 16,
              color: colors.textMuted,
              padding: "8px 20px",
              borderRadius: 100,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Author */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: authorOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: 16,
            color: colors.textMuted,
          }}
        >
          Made by 狐闹HuLab · link3.cc/hulab
        </div>
      </div>
    </AbsoluteFill>
  );
};
