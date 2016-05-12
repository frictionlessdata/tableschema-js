var _ = require('underscore');
var Promise = require('bluebird');
var request = require('superagent');
var url = require('url');


module.exports = {
  REMOTE_SCHEMES: ['http', 'https', 'ftp', 'ftps'],
  NULL_VALUES: ['null', 'none', 'nil', 'nan', '-', ''],
  TRUE_VALUES: ['yes', 'y', 'true', 't', '1'],
  FALSE_VALUES: ['no', 'n', 'false', 'f', '0'],

  isHash: function(value) { return _.isObject(value) && !_.isArray(value) && !_.isFunction(value); },

  // Load a JSON source, from string, URL or buffer, into a Python type.
  loadJSONSource: function(source) {
    if(_.isNull(source) || _.isUndefined(source))
      return null;
    else if(_.isObject(source) && !_.isFunction(source))
      // The source has already been loaded. Return Promise object for consistency.
      return source;

    if(_.contains(module.exports.REMOTE_SCHEMES, url.parse(source).protocol.replace(':', '')))
      return new Promise(function(RS, RJ) {
        request
          .get(source)

          .end(function(E, R) {
            if(E)
              RJ('Failed to download registry file: ' + error);

            RS(JSON.parse(source));
          });
      });

    // WARN There is no possibility to have browser compatable code which can load file
  }
};