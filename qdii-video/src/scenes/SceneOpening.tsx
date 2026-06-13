import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";

export const SceneOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [20, 50], [30, 0], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [50, 80], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [50, 80], [20, 0], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [80, 110], [0, 1], { extrapolateRight: "clamp" });
  const decorOpacity = interpolate(frame, [60, 90], [0, 0.08], { extrapolateRight: "clamp" });

  // Fade out at end
  const fadeOut = interpolate(frame, [200, 240], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.white,
        opacity: fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Background decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          backgroundColor: colors.primary,
          opacity: decorOpacity,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          backgroundColor: colors.accent,
          opacity: decorOpacity * 0.6,
          filter: "blur(60px)",
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Three status dots */}
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: colors.green,
              transform: `scale(${spring({ frame: frame - 5, fps, config: { damping: 8 } })})`,
            }}
          />
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: colors.amber,
              transform: `scale(${spring({ frame: frame - 10, fps, config: { damping: 8 } })})`,
            }}
          />
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: colors.red,
              transform: `scale(${spring({ frame: frame - 15, fps, config: { damping: 8 } })})`,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 80,
              color: colors.text,
              letterSpacing: -2,
            }}
          >
            QDII Watch
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 500,
              fontSize: 30,
              color: colors.textSecondary,
            }}
          >
            QDII 基金申购限额监控平台
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            textAlign: "center",
            marginTop: 32,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 400,
              fontSize: 20,
              color: colors.textMuted,
              padding: "10px 28px",
              borderRadius: 100,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
            }}
          >
            每日自动监控 · 第一时间推送
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
