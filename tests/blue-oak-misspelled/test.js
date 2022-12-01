var tap = require('tap')

var results = require('../run')(['--blueoak=foobar'], __dirname)

tap.equal(results.status, 1)
