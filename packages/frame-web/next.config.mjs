/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000"),
  },
};

export default nextConfig;
