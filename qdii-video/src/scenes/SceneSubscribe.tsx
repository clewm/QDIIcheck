import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";

const steps = [
  { num: "01", title: "关注基金", desc: "点击爱心图标，收藏你关心的 QDII 基金", icon: "❤️" },
  { num: "02", title: "输入邮箱", desc: "设置接收通知的邮箱地址", icon: "📧" },
  { num: "03", title: "选择时间", desc: "设定每日推送时间（北京时间）", icon: "⏰" },
];

export const SceneSubscribe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [560, 600], [1, 0], { extrapolateRight: "clamp" });

  // Email preview animation
  const emailOpacity = interpolate(frame, [200, 230], [0, 1], { extrapolateRight: "clamp" });
  const emailY = interpolate(frame, [200, 230], [30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Left: Steps */}
      <div style={{ position: "absolute", top: 80, left: 120, width: 640 }}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 16,
            color: colors.primary,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 16,
            opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          SUBSCRIBE
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 44,
            color: colors.text,
            marginBottom: 12,
            opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame, [15, 35], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          邮件订阅
          <br />
          <span style={{ color: colors.primary }}>交易日自动推送</span>
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: 20,
            color: colors.textMuted,
            lineHeight: 1.6,
            marginBottom: 44,
            opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          订阅后，每个交易日将在设定时间收到邮件，
          <br />
          包含关注基金的限额情况及新增 QDII 基金。
        </div>

        {/* Steps */}
        {steps.map((s, i) => {
          const delay = 60 + i * 40;
          const opacity = interpolate(frame, [delay, delay + 25], [0, 1], {
            extrapolateRight: "clamp",
          });
          const x = interpolate(frame, [delay, delay + 25], [-20, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                marginBottom: 28,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: colors.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontWeight: 700,
                    fontSize: 13,
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  STEP {s.num}
                </div>
                <div
                  style={{
                    fontFamily: fonts.sans,
                    fontWeight: 700,
                    fontSize: 20,
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: fonts.sans,
                    fontWeight: 400,
                    fontSize: 16,
                    color: colors.textMuted,
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Email preview mockup */}
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 100,
          width: 560,
          backgroundColor: colors.white,
          borderRadius: 20,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
          overflow: "hidden",
          opacity: emailOpacity,
          transform: `translateY(${emailY}px)`,
        }}
      >
        {/* Email header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${colors.border}`,
            backgroundColor: "#FAFBFC",
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 400,
              fontSize: 13,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            发件人: QDII Watch &lt;noreply@hulab.top&gt;
          </div>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 18,
              color: colors.text,
            }}
          >
            📊 QDII 基金日报 - 2026年6月13日
          </div>
        </div>

        {/* Email body preview */}
        <div style={{ padding: "24px 28px" }}>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 600,
              fontSize: 16,
              color: colors.text,
              marginBottom: 20,
            }}
          >
            您关注的基金限额情况:
          </div>

          {/* Mock fund rows */}
          {[
            { name: "华夏纳斯达克100", status: "不限额", color: colors.green },
            { name: "博时标普500ETF联接", status: "限额 1000元", color: colors.amber },
            { name: "易方达黄金ETF联接", status: "暂停买入", color: colors.red },
          ].map((f, i) => {
            const rowDelay = 280 + i * 25;
            const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 15], [0, 1], {
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  backgroundColor: i % 2 === 0 ? "#F8FAFC" : colors.white,
                  borderRadius: 10,
                  marginBottom: 6,
                  opacity: rowOpacity,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.sans,
                    fontWeight: 500,
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  {f.name}
                </span>
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontWeight: 600,
                    fontSize: 14,
                    color: f.color,
                    backgroundColor:
                      f.color === colors.green
                        ? colors.greenLight
                        : f.color === colors.amber
                        ? colors.amberLight
                        : colors.redLight,
                    padding: "4px 12px",
                    borderRadius: 6,
                  }}
                >
                  {f.status}
                </span>
              </div>
            );
          })}

          {/* Change indicator */}
          <div
            style={{
              marginTop: 20,
              padding: "14px 18px",
              backgroundColor: colors.primaryLight,
              borderRadius: 10,
              opacity: interpolate(frame, [360, 380], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <div
              style={{
                fontFamily: fonts.sans,
                fontWeight: 600,
                fontSize: 14,
                color: colors.primary,
              }}
            >
              📢 变化提醒
            </div>
            <div
              style={{
                fontFamily: fonts.sans,
                fontWeight: 400,
                fontSize: 14,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              博时标普500ETF联接: 限额 500 → 1000 元 ↑
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
