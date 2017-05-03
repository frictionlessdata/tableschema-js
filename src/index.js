require('babel-polyfill')
const Table = require('./table')
const Schema = require('./schema')
const Field = require('./field')
const validate = require('./validate')
const infer = require('./infer')

export default {Table, Schema, Field, validate, infer}
export {Table, Schema, Field, validate, infer}
