const {assert} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')


// Constants

const TESTS = [
  ['default', 'string', 'string'],
  ['default', '', ''],
  ['default', 0, ERROR],
  ['uri', 'http://google.com', 'http://google.com'],
  ['uri', 'ftp://example.org/resource.txt', 'ftp://example.org/resource.txt'],
  ['uri', 'ftp://8.8.8.8', 'ftp://8.8.8.8'],
  ['uri', '8.8.8.8', ERROR], // We require a protocol scheme (ftp:, http:, ...) in the URI
  ['uri', 'string', ERROR],
  ['uri', '', ERROR],
  ['uri', 0, ERROR],
  ['email', 'name@gmail.com', 'name@gmail.com'],
  ['email', 'http://google.com', ERROR],
  ['email', 'string', ERROR],
  ['email', '', ERROR],
  ['email', 0, ERROR],
  ['uuid', '95ecc380-afe9-11e4-9b6c-751b66dd541e', '95ecc380-afe9-11e4-9b6c-751b66dd541e'],
  ['uuid', '0a7b330a-a736-35ea-8f7f-feaf019cdc00', '0a7b330a-a736-35ea-8f7f-feaf019cdc00'],
  ['uuid', '0a7b330a-a736-35ea-8f7f-feaf019cdc', ERROR],
  ['uuid', 'string', ERROR],
  ['uuid', '', ERROR],
  ['uuid', 0, ERROR],
  ['binary', 'YXN1cmUu', 'YXN1cmUu'],
  ['binary', 'c3VyZS4=', 'c3VyZS4='],
  ['binary', 'dGVzdA==', 'dGVzdA=='],
  ['binary', 'string', ERROR],
  ['binary', '', ERROR],
  ['binary', 0, ERROR],
]

// Tests

describe('castString', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castString(format, value), result)
    })
  })

})
