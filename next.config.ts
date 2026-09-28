import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = isGitHubPages ? "/gamecove-dashboard-ver.02" : "";

const nextConfig: NextConfig = {
  // 개발 도구 배지(N)가 왼쪽 아래 프로필 카드를 가려서 끈다. 오류 표시는 그대로 뜬다.
  devIndicators: false,
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
