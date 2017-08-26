var tap = require('tap')

var results = require('../run')(['--production'], __dirname)

tap.equal(results.status, 0)

tap.equal(
  results.stdout.indexOf('NOT APPROVED') === -1,
  true
)
