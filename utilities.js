module.exports = {
  REMOTE_SCHEMES: ['http', 'https', 'ftp', 'ftps'],
  NULL_VALUES: ['null', 'none', 'nil', 'nan', '-', ''],
  TRUE_VALUES: ['yes', 'y', 'true', 't', '1'],
  FALSE_VALUES: ['no', 'n', 'false', 'f', '0'],

  // Load a JSON source, from string, URL or buffer,  into a Python type.
  load_json_source: function (source) {
    if(_.isNull(source) || _.isUndefined(source))
      return null;
    else if(_.isArray(source))
      // the source has already been loaded
      return source;

    // WARN Port compat
    if(_.contains(REMOTE_SCHEMES, compat.parse.urlparse(source).scheme))
      // WARN Use superagent
      source = requests.get(source).text;

    // WARN Port compat
    else if(isinstance(source, compat.str) and not os.path.exists(source))
      continue;

    else
      with io.open(source, encoding='utf-8') as stream:
        source = stream.read()

    return JSON.parse(source);
  }
};