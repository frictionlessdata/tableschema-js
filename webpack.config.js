const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const ENV = process.env.NODE_ENV || 'development'


// Base

let webpackConfig = {
  entry: './src/index.js',
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ },
    ]
  },
  output: {
    library: 'tableschema',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.USER_ENV': JSON.stringify('browser')
    }),
    new webpack.IgnorePlugin(/fs-readfile-promise/),
  ],
  node: {
    fs: 'empty',
    http: 'empty',
    https: 'empty',
  },
}


// Development

if (ENV === 'development') {
  webpackConfig = merge(webpackConfig, {
    output: {
      filename: 'tableschema.js',
      path: path.resolve(__dirname, './dist'),
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development')
      })
    ]
  });
}


// Production

if (ENV === 'production') {
  webpackConfig = merge(webpackConfig, {
    output: {
      filename: 'tableschema.min.js',
      path: path.resolve(__dirname, './dist'),
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compressor: {
          screw_ie8: true,
          warnings: false,
        }
      })
    ]
  });
}

module.exports = webpackConfig
