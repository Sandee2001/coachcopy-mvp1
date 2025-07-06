/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle transformers library properly
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@xenova/transformers': '@xenova/transformers/dist/transformers.min.js',
      }
    }
    
    // Exclude Node.js specific packages
    config.externals.push({
      'onnxruntime-node': 'commonjs onnxruntime-node',
      'sharp': 'commonjs sharp',
      'canvas': 'commonjs canvas',
    })
    
    // Additional fallbacks for client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "onnxruntime-node": false,
        "onnxruntime-common": false,
        "fs": false,
        "path": false,
        "crypto": false,
        "stream": false,
        "util": false,
        "buffer": false,
        "process": false,
        "child_process": false,
        "worker_threads": false,
      }
    }
    
    // Ignore .node files completely
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader'
    })
    
    // Ensure proper module resolution
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
    }
    
    return config
  },
}

module.exports = nextConfig