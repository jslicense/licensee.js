var tap = require('tap')

var results = require('../run')([ ], __dirname)

tap.equal(results.status, 1)

tap.equal(
  results.stderr.trim(),
  'mit-licensed@1.0.0 (MIT)')
