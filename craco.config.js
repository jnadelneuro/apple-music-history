// craco.config.js

const CracoWebpackPlugin = require('craco-webpack-plugin');

module.exports = {
  webpack: {
    plugins: [
      new CracoWebpackPlugin(),
    ],
    resolve: {
      fallback: {
        stream: require.resolve('stream-browserify'),
      },
    },
  },
};