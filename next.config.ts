import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bina server standalone hanya untuk imej Docker (DOCKER_BUILD=1).
  // Deploy Vercel kekal seperti sedia ada.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
};

export default nextConfig;
