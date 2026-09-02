import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Logos, backgrounds and the banner are served straight out of
        // public/, so Next gives them no cache lifetime of their own and
        // browsers re-request them on every navigation. They change rarely;
        // a week of caching with revalidation keeps repeat loads off the wire.
        source: "/:file(.*\\.(?:webp|png|svg))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
