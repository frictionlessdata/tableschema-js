const webpackConfig = require('./webpack.config.js')
delete webpackConfig.entry

// Base

const karmaConfig = (config) => {
  config.set({
    singleRun: true,
    browsers: ['PhantomJS'],
    frameworks: ['mocha', 'sinon-chai'],
    files: ['test/karma.opts'],
    reporters: ['spec'],
    preprocessors: {
      'test/karma.opts': ['webpack'],
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    },
  })
}

// Module API

module.exports = karmaConfig
