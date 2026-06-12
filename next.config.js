/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Cloudflare Pages, use the @cloudflare/next-on-pages adapter
  experimental: {
    instrumentationHook: true,
  },
}

// If building for Cloudflare Pages, use the adapter
if (process.env.CF_PAGES) {
  const { withCloudflarePages } = require('@cloudflare/next-on-pages/next')
  module.exports = withCloudflarePages()(nextConfig)
} else {
  module.exports = nextConfig
}
