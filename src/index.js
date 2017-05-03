require('babel-polyfill')
const Table = require('./table').Table
const Schema = require('./schema').Schema
const Field = require('./field').Field
const validate = require('./validate').validate
const infer = require('./infer').infer

export default {Table, Schema, Field, validate, infer}
export {Table, Schema, Field, validate, infer}
