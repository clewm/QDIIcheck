import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";

const features = [
  {
    icon: "🔍",
    title: "智能搜索",
    desc: "按基金名称、代码或行业标签快速查找",
    color: colors.primary,
    bg: colors.primaryLight,
  },
  {
    icon: "🏷️",
    title: "行业分类",
    desc: "自动识别 40+ 行业标签：半导体、AI、纳指、黄金…",
    color: colors.accent,
    bg: "#EDE9FE",
  },
  {
    icon: "📊",
    title: "多维排序",
    desc: "按收益率、限额金额、日涨跌幅灵活排序",
    color: colors.green,
    bg: colors.greenLight,
  },
  {
    icon: "❤️",
    title: "关注基金",
    desc: "一键收藏关注的基金，单独查看更高效",
    color: colors.red,
    bg: colors.redLight,
  },
  {
    icon: "📈",
    title: "详细数据",
    desc: "净值、收益、限额、费率——点击查看完整信息",
    color: colors.amber,
    bg: colors.amberLight,
  },
  {
    icon: "📱",
    title: "移动适配",
    desc: "手机端完美适配，随时随地查看限额状态",
    color: colors.primary,
    bg: colors.primaryLight,
  },
];

export const SceneFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [560, 600], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.white,
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
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
            marginBottom: 16,
          }}
        >
          FEATURES
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 44,
            color: colors.text,
          }}
        >
          核心功能
        </div>
      </div>

      {/* Feature grid - 3x2 */}
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 140,
          right: 140,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 28,
        }}
      >
        {features.map((f, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const delay = 40 + row * 30 + col * 20;
          const opacity = interpolate(frame, [delay, delay + 25], [0, 1], {
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [delay, delay + 25], [30, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                backgroundColor: colors.bg,
                borderRadius: 20,
                padding: "36px 32px",
                opacity,
                transform: `translateY(${y}px)`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: f.bg,
                  fontSize: 28,
                  marginBottom: 20,
                }}
              >
                {f.icon}
              </div>
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 700,
                  fontSize: 22,
                  color: colors.text,
                  marginBottom: 10,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 400,
                  fontSize: 16,
                  color: colors.textMuted,
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom highlight */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [250, 280], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: colors.greenLight,
            padding: "14px 32px",
            borderRadius: 100,
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 20,
            color: colors.green,
          }}
        >
          <span style={{ fontSize: 22 }}>✓</span>
          全部功能免费，无需注册
        </div>
      </div>
    </AbsoluteFill>
  );
};
