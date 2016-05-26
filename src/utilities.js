export default {
  REMOTE_SCHEMES: ['http', 'https', 'ftp', 'ftps']
  , NULL_VALUES: ['null', 'none', 'nil', 'nan', '-', '', null]
  , TRUE_VALUES: ['yes', 'y', 'true', 't', '1']
  , FALSE_VALUES: ['no', 'n', 'false', 'f', '0']
  , isNumeric(value) {
    return !isNaN(parseInt(value, 10)) && isFinite(value)
  }
  , isInteger(value) {
    if (this.isNumeric(value)) {
      return Number.isInteger(+value)
    }
    return false
  }
}
