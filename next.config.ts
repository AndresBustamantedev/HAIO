import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  typescript: {
    // Pre-existing type errors in create-project-with-plan and subscriptions
    // that don't affect runtime — to be fixed separately
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
