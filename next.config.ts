import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // このプロジェクト自身をルートとして指定(ホームディレクトリのlockfileとの衝突を防ぐ)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
