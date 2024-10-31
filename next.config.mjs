/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    logger: {
      warn: (message) => {
        if (
          message.includes(
            'Deprecation The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.'
          )
        )
          return;
        console.warn(message);
      },
    },
  },
};

export default nextConfig;
