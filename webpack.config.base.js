'use strict'

module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ }
    ]
  },
  output: { library: 'JSONTableSchema', libraryTarget: 'umd' },
  node: {
    fs: "empty"
  }
}
