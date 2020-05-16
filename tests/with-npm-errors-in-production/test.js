var tap = require('tap')

var results = require('../run')(['--production'], __dirname)

tap.equal(results.status, 0)

tap.equal(
  results.stderr.indexOf('Warning: npm exited with status 1') !== -1,
  true
)
