import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` used to be
  // here. Both are gone as of M1, in the sequence DECISIONS.md §5 set out:
  //
  // - `eslint` was dead config. Next 16 removed the key, so every build printed
  //   "Unrecognized key(s) in object: 'eslint'" and linted nothing. `next lint`
  //   is gone too; CI runs `eslint` directly.
  // - `typescript.ignoreBuildErrors: true` came from 9eb8c99 ("ignore eslint
  //   and ts errors during build for vercel deployment") and was never
  //   reverted, so type errors shipped to production for months. M0 measured
  //   the pile at one error; M1 fixed it and made typecheck blocking in CI.
  //
  // Do not add either back to get a deploy out. Fix the type.

  async redirects() {
    // `UPDATE.md` §10 puts the legal documents under `/legal/*`. They used to
    // live at the top level, and those URLs are linked from the footer of every
    // page indexed so far — so they redirect rather than 404.
    //
    // Permanent (308), because they are never coming back: a temporary
    // redirect would leave both URLs eligible to rank and split whatever
    // authority the originals have.
    return [
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
    ];
  },
};

export default nextConfig;
