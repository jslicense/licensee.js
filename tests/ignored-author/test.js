var tap = require('tap')

var results = require('../run')(['--corrections'], __dirname)

tap.equal(results.status, 0)
