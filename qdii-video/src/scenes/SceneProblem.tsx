import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";

const problems = [
  { icon: "📊", text: "QDII 基金限额状态随时变化", sub: "开放、限额、暂停——每天可能不同" },
  { icon: "⏰", text: "手动逐只查询太耗时", sub: "数百只 QDII 基金，逐一查看不现实" },
  { icon: "😫", text: "错过最佳申购窗口", sub: "限额开放转瞬即逝，错过即损失机会" },
];

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [320, 360], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 160,
          opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 16,
            color: colors.primary,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          THE PROBLEM
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 160,
          opacity: interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(frame, [20, 45], [20, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 52,
            color: colors.text,
            lineHeight: 1.2,
          }}
        >
          投资 QDII 基金
          <br />
          <span style={{ color: colors.red }}>痛点是什么？</span>
        </div>
      </div>

      {/* Problem cards */}
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 160,
          right: 160,
          display: "flex",
          gap: 32,
        }}
      >
        {problems.map((p, i) => {
          const cardDelay = 60 + i * 40;
          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 30],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          const cardY = interpolate(
            frame,
            [cardDelay, cardDelay + 30],
            [40, 0],
            { extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 20,
                padding: "40px 36px",
                border: `1px solid ${colors.border}`,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 20 }}>{p.icon}</div>
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 700,
                  fontSize: 24,
                  color: colors.text,
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                {p.text}
              </div>
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 400,
                  fontSize: 18,
                  color: colors.textMuted,
                  lineHeight: 1.5,
                }}
              >
                {p.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom emphasis */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [200, 230], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 26,
            color: colors.textSecondary,
          }}
        >
          你需要一个<span style={{ color: colors.primary }}> 自动化 </span>的解决方案
        </div>
      </div>
    </AbsoluteFill>
  );
};
