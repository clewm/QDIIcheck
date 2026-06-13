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

export const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [410, 450], [1, 0], { extrapolateRight: "clamp" });

  const titleOpacity = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [15, 40], [30, 0], { extrapolateRight: "clamp" });
  const descOpacity = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: "clamp" });
  const screenshotOpacity = interpolate(frame, [70, 100], [0, 1], { extrapolateRight: "clamp" });
  const screenshotScale = interpolate(frame, [70, 100], [0.95, 1], { extrapolateRight: "clamp" });

  // Feature pills
  const features = ["自动采集数据", "实时状态展示", "邮件订阅推送", "免费使用"];
  const pillStart = 120;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.white,
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Left content area */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 120,
          width: 580,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 16,
            color: colors.primary,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 20,
            opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          THE SOLUTION
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 52,
              color: colors.text,
              lineHeight: 1.2,
              letterSpacing: -1,
            }}
          >
            QDII Watch
          </div>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 52,
              color: colors.primary,
              lineHeight: 1.2,
            }}
          >
            一站式监控平台
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            opacity: descOpacity,
            marginTop: 28,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 400,
              fontSize: 22,
              color: colors.textSecondary,
              lineHeight: 1.7,
            }}
          >
            每日自动采集全市场 QDII 基金数据，
            <br />
            一眼看清申购状态与限额变化，
            <br />
            支持邮件订阅，交易日自动推送。
          </div>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 36,
          }}
        >
          {features.map((f, i) => {
            const pDelay = pillStart + i * 15;
            const pOpacity = interpolate(frame, [pDelay, pDelay + 20], [0, 1], {
              extrapolateRight: "clamp",
            });
            const pScale = spring({
              frame: frame - pDelay,
              fps,
              config: { damping: 10, mass: 0.6 },
            });

            return (
              <div
                key={i}
                style={{
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                  fontFamily: fonts.sans,
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "10px 22px",
                  borderRadius: 100,
                  opacity: pOpacity,
                  transform: `scale(${Math.min(pScale, 1)})`,
                }}
              >
                ✓ {f}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right screenshot area */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 80,
          width: 800,
          height: 680,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)",
          opacity: screenshotOpacity,
          transform: `scale(${screenshotScale})`,
        }}
      >
        {/* Browser chrome mockup */}
        <div
          style={{
            height: 44,
            backgroundColor: "#F1F5F9",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FECACA" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FDE68A" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#BBF7D0" }} />
          <div
            style={{
              marginLeft: 16,
              flex: 1,
              height: 28,
              borderRadius: 6,
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 12,
            }}
          >
            <span
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              qdii.hulab.top
            </span>
          </div>
        </div>
        <Img
          src={staticFile("screenshots/dashboard-viewport.png")}
          style={{
            width: "100%",
            height: "calc(100% - 44px)",
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
