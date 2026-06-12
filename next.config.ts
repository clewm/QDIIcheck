import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    // EdgeOne 运行时无法加载 Turbopack 拆分的 chunked modules，
    // 将这些包排除出打包，改用 Node.js 原生 require 加载
    "@aws-sdk/client-s3",
    "cheerio",
    "nodemailer",
  ],
};

export default nextConfig;
