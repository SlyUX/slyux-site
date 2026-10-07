import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> integration: powers the 3 × 3 map's panning
    // navigation. See src/components/grid-nav.tsx.
    viewTransition: true,
  },
  // Old URLs from the first structure. Permanent so links and search results
  // follow the move.
  async redirects() {
    return [
      { source: "/work", destination: "/case-studies", permanent: true },
      { source: "/work/:slug", destination: "/case-studies/:slug", permanent: true },
      { source: "/creative", destination: "/portfolio", permanent: true },
      // The publishing case study, refocused on one site and renamed.
      { source: "/case-studies/publishing", destination: "/case-studies/jesus-calling", permanent: true },
    ];
  },
  images: {
    // Sanity serves every asset from this host. Required for next/image.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
};

export default nextConfig;
