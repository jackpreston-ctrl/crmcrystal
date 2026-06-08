/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet ships ESM — transpile it so Next bundles it cleanly.
  transpilePackages: ["react-leaflet", "@react-leaflet/core"],
};

export default nextConfig;
