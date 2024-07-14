/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
    forceIpv4First: process.env.FORCE_IPV4_FIRST === 'true' ? 'true' : 'false',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    JELLYFIN_TYPE: process.env.JELLYFIN_TYPE,
  },
  images: {
    remotePatterns: [
      { hostname: 'gravatar.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: '*', protocol: 'https' },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts)x?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  experimental: {
    scrollRestoration: true,
    largePageDataBytes: 256000,
  },
};
