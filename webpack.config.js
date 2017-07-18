const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const merge = require('webpack-merge');

const banner = `${pkg.name}
Description: ${pkg.description}
Author: ${pkg.author}
Version: v${pkg.version}`;

const config = {
  entry: {
    mesh: ['./src/index.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist',
    filename: 'index.debug.js',
    libraryTarget: 'umd',
    library: ['Tiny', '[name]'],
  },
  plugins: [
    new webpack.BannerPlugin(banner),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
};

// 压缩版
const minConfig = merge(config, {
  output: {
    filename: 'index.js',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
  ],
});

module.exports = [config, minConfig];
