var _ = require('lodash')
var webpack = require('webpack')
var baseConfig = require('./webpack.config.base')

var productionConfig = {
  output: {
    filename: 'jsontableschema.min.js',
    path: './dist'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,
        warnings: false
      }
    })
  ]
}

var config = _.merge({}, baseConfig, productionConfig)

module.exports = config
