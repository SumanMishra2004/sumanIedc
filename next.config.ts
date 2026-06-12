import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: {
    compilationMode: "annotation",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        // Sanity image CDN
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        // Cloudinary (used in existing hardcoded slides)
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        // Unsplash (used in existing team member fallback images)
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
