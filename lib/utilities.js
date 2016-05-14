'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _underscore = require('underscore');

var _bluebird = require('bluebird');

var _superagent = require('superagent');

var _url = require('url');

exports.default = {
  REMOTE_SCHEMES: ['http', 'https', 'ftp', 'ftps'],
  NULL_VALUES: ['null', 'none', 'nil', 'nan', '-', ''],
  TRUE_VALUES: ['yes', 'y', 'true', 't', '1'],
  FALSE_VALUES: ['no', 'n', 'false', 'f', '0'],

  isHash: function isHash(value) {
    return _underscore._.isObject(value) && !_underscore._.isArray(value) && !_underscore._.isFunction(value);
  }

  // Load a JSON source, from string, URL or buffer, into a Python type.
  ,
  loadJSONSource: function loadJSONSource(source) {
    if (_underscore._.isNull(source) || _underscore._.isUndefined(source)) {
      return null;
    } else if (_underscore._.isObject(source) && !_underscore._.isFunction(source)) {
      // The source has already been loaded. Return Promise object for
      // consistency.
      return source;
    }

    if (_underscore._.contains(this.REMOTE_SCHEMES, _url.url.parse(source).protocol.replace(':', ''))) {
      return new _bluebird.Promise(function (resolve, reject) {
        _superagent.request.get(source).end(function (error, response) {
          if (error) {
            reject('Failed to download registry file: ' + String(error));
          } else {
            resolve(JSON.parse(response));
          }
        });
      });
    }
    return null;
    // WARN There is no possibility to have browser compatable code which can
    // load file
  }
};
//# sourceMappingURL=utilities.js.map