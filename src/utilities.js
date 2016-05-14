import { _ } from 'underscore'
import { Promise } from 'bluebird'
import { request } from 'superagent'
import { url } from 'url'

export default {
  REMOTE_SCHEMES: ['http', 'https', 'ftp', 'ftps']
  , NULL_VALUES: ['null', 'none', 'nil', 'nan', '-', '']
  , TRUE_VALUES: ['yes', 'y', 'true', 't', '1']
  , FALSE_VALUES: ['no', 'n', 'false', 'f', '0']

  , isHash(value) {
    return _.isObject(value) && !_.isArray(value) && !_.isFunction(value)
  }

  // Load a JSON source, from string, URL or buffer, into a Python type.
  , loadJSONSource(source) {
    if (_.isNull(source) || _.isUndefined(source)) {
      return null
    } else if (_.isObject(source) && !_.isFunction(source)) {
      // The source has already been loaded. Return Promise object for
      // consistency.
      return source
    }

    if (_.contains(this.REMOTE_SCHEMES,
                   url.parse(source).protocol.replace(':', ''))) {
      return new Promise((resolve, reject) => {
        request.get(source).end((error, response) => {
          if (error) {
            reject(`Failed to download registry file: ${error}`)
          } else {
            resolve(JSON.parse(response))
          }
        })
      })
    }
    return null
    // WARN There is no possibility to have browser compatable code which can
    // load file
  }
}
