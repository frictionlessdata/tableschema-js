'use strict';

var _types = require('./types');

var types = _interopRequireWildcard(_types);

var _infer = require('./infer');

var _infer2 = _interopRequireDefault(_infer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

module.exports = { infer: _infer2.default, types: types };
//# sourceMappingURL=index.js.map