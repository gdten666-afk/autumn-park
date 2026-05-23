import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // @libsql/client works with Node.js bundling, no external packages needed
};

export default nextConfig;
