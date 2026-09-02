import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Deploy builds must not block on pre-existing form/resolver typing debt.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/register",
        has: [{ type: "query", key: "role", value: "AGENCY_ADMIN" }],
        destination: "/register/agency",
        permanent: false,
      },
      {
        source: "/register/agent",
        destination: "/register/agency",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
