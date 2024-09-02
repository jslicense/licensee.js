var tap = require('tap')

var results = require('../run')(['--osi'], __dirname)

tap.equal(results.status, 0)
