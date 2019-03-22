var tap = require('tap')

var results = require('../run')(['--blueoak=bronze'], __dirname)

tap.equal(results.status, 0)
