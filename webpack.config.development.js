var _ = require('lodash')
var webpack = require('webpack')
var baseConfig = require('./webpack.config.base')

var developmentConfig = {
  output: {
    filename: 'jsontableschema.js',
    path: './dist'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
}

var config = _.merge({}, baseConfig, developmentConfig)

module.exports = config
