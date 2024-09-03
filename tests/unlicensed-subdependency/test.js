var tap = require('tap')

var results = require('../run')(['--ndjson'], __dirname)

tap.equal(results.status, 1)

var output = results.stdout.trim().split('\n').map(line => JSON.parse(line))

tap.assert(
  output.some(result => result.name === 'mit-licensed-depends-on-not-licensed' && result.approved === false)
)

tap.assert(
  output.some(result => result.name === 'not-licensed' && result.approved === false)
)
