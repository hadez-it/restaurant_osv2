/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure the Prisma query engine binary is bundled into serverless functions
    outputFileTracingIncludes: {
      "/**": ["./node_modules/.prisma/client/**/*"],
    },
  },
};

export default nextConfig;
