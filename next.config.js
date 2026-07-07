/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
  // Never expose server env vars to the client. Only NEXT_PUBLIC_*
  // variables are ever bundled into browser JS by Next.js - GEMINI_API_KEY,
  // DATABASE_URL, JWT_SECRET etc. are read only inside app/api/* route
  // handlers, which run exclusively on the server / Vercel serverless functions.
};

module.exports = nextConfig;
