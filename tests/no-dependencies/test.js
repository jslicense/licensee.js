var tap = require('tap')

tap.equal(require('../run')([ ], __dirname).status, 0)
