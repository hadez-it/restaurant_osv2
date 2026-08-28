/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure the Prisma query engine binary is bundled into serverless functions
    outputFileTracingIncludes: {
      "/**/*": ["./src/generated/prisma/*.node"],
    },
  },
};

export default nextConfig;
