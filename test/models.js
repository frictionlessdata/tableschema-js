// var _ = require('underscore');
// var assert = require('chai').assert;
// var SchemaModel = require('../models');
// var SCHEMA;
//
//
// describe('Models', function() {
//   beforeEach(function(done, err) {
//     SCHEMA = {fields: [
//       {
//         name: 'id',
//         type: 'string',
//         constraints: {required: true}
//       },
//
//       {
//         name: 'height',
//         type: 'number',
//         constraints: {required: false}
//       },
//
//       {
//         name: 'age',
//         type: 'integer',
//         constraints: {required: false}
//       },
//
//       {
//         name: 'name',
//         type: 'string',
//         constraints: {required: true}
//       },
//
//       {
//         name: 'occupation',
//         type: 'string',
//         constraints: {required: false}
//       }
//     ]};
//
//     done();
//   });
//
//   it('have a correct number of header columns', function(done, err) {
//     assert.equal((new SchemaModel(SCHEMA)).headers().length, 5);
//     done();
//   });
//
//   it('have a correct number of header required columns', function(done, err) {
//     assert.equal((new SchemaModel(SCHEMA)).requiredHeaders().length, 2);
//     done();
//   });
//
//   it('have one of a field from passed schema', function(done, err) {
//     assert((new SchemaModel(SCHEMA)).hasField('name'));
//     done();
//   });
//
//   it('do not have fields not specified in passed schema', function(done, err) {
//     assert.notOk((new SchemaModel(SCHEMA)).hasField('religion'));
//     done();
//   });
//
//   it('have correct number of fields of certain type', function(done, err) {
//     var model = new SchemaModel(SCHEMA);
//
//
//     assert.equal(model.getFieldsByType('string').length, 3);
//     assert.equal(model.getFieldsByType('number').length, 1);
//     assert.equal(model.getFieldsByType('integer').length, 1);
//     done();
//   });
//
//   it('respect caseInsensitiveHeaders option', function(done, err) {
//     SCHEMA.fields = _.map(SCHEMA.fields, function(F) {
//       F.name = F.name[0].toUpperCase() + _.rest(F.name).join('').toLowerCase();
//       return F;
//     });
//
//     assert.deepEqual(
//       (new SchemaModel(SCHEMA, {caseInsensitiveHeaders: true})).headers().sort(),
//       ['id', 'height', 'name', 'age', 'occupation'].sort()
//     );
//
//     done();
//   });
//
//   it('raise exception when invalid json passed as schema', function(done, err) {
//     try {
//       new SchemaModel('this is string');
//     } catch(E) {
//       done();
//     }
//   });
//
//   it('raise exception when invalid format schema passed', function(done, err) {
//     try {
//       new SchemaModel({});
//     } catch(E) {
//       done();
//     }
//   });
// });
