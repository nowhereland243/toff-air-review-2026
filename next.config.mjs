/** @type {import('next').NextScript} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/2026',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
