var tap = require('tap')

var results = require('../run')([ ], __dirname)

tap.equal(results.status, 0)
