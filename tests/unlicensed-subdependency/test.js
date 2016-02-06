var tap = require('tap')

var results = require('../run')([ ], __dirname)

tap.equal(results.status, 1)

tap.equal(
  results.stderr.trim(),
  'mit-licensed-dependes-on-not-licensed > not-licensed')
