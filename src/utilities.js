export default {
  REMOTE_SCHEMES: ['http', 'https', 'ftp', 'ftps']
  , NULL_VALUES: ['null', 'none', 'nil', 'nan', '-', '']
  , TRUE_VALUES: ['yes', 'y', 'true', 't', '1']
  , FALSE_VALUES: ['no', 'n', 'false', 'f', '0']

  , isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value)
  }

  , isInteger(value) {
    if (this.isNumeric(value)) {
      return Number.isInteger(+value)
    }
    return false
  }

  , isNull(value) {
    return value === null || this.NULL_VALUES.indexOf(value) !== -1
  }

  , isTrue(value) {
    return value === true || this.TRUE_VALUES.indexOf(value) !== -1
  }

  , isFalse(value) {
    return value === false || this.FALSE_VALUES.indexOf(value) !== -1
  }

  , isURL(protocol) {
    if (!protocol) return false
    return this.REMOTE_SCHEMES.indexOf(protocol.replace(':', '')) !== -1
  }
}
