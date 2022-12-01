var tap = require('tap')
var Ajv = require('ajv')
var schema = require('../configuration-schema')

var ajv = new Ajv({ allErrors: true })
var validate = ajv.compile(schema)

tap.test('configuration schema', function (test) {
  ajv.validateSchema(schema)
  test.same(ajv.errors, null, 'no schema errors')
  test.end()
})

tap.test('valid configuration', function (test) {
  test.ok(
    validate({
      licenses: { osi: true, blueOak: 'silver' },
      packages: { licensee: '1.0.0' }
    }),
    'valid configuration validates'
  )
  test.end()
})

tap.test('invalid configuration', function (test) {
  test.notOk(
    validate({
      licenses: { blueoak: 'silver' }
    }),
    'configuration with lower-case "blueoak" fails'
  )
  test.end()
})
