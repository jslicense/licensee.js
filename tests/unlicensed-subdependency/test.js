var tap = require('tap')

var results = require('../run')([ ], __dirname)

tap.equal(results.status, 1)

tap.equal(
  results.stderr.trim(),
  [ 'mit-licensed-depends-on-not-licensed@1.0.1 (MIT)',
    'not-licensed@1.0.0 (Invalid license metadata)' ]
    .join('\n'))
