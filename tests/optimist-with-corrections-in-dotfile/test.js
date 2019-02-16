var tap = require('tap')

var results = require('../run')([/* no corrections flag */], __dirname)

tap.equal(results.status, 0)
