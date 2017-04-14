// Require babel polyfill
require('babel-polyfill')

// Require tests for karma
const testsContext = require.context('./test', true, /\.js$/)
testsContext.keys().forEach(testsContext)
