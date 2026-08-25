/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace package from source in the Next build.
  transpilePackages: ['@tunefour/shared-types'],
};

export default nextConfig;
