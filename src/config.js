// Module API

const ERROR = 'tableschema.error'
const INFER_THRESHOLD = 10
const INFER_CONFIDENCE = 0.75
const DEFAULT_FORMAT = 'csv'
const DEFAULT_ENCODING = 'utf-8'
const DEFAULT_FIELD_TYPE = 'string'
const DEFAULT_FIELD_FORMAT = 'default'
const DEFAULT_MISSING_VALUES = ['']
const IS_BROWSER = typeof window !== 'undefined'

// System

module.exports = {
  ERROR,
  INFER_THRESHOLD,
  INFER_CONFIDENCE,
  DEFAULT_FORMAT,
  DEFAULT_ENCODING,
  DEFAULT_FIELD_TYPE,
  DEFAULT_FIELD_FORMAT,
  DEFAULT_MISSING_VALUES,
  IS_BROWSER,
}
