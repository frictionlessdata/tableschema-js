module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json' }
      , { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ }
    ]
  },
  output: { library: 'JSONTableSchema', libraryTarget: 'umd' },
  node: {
    fs: "empty"
  }
}
