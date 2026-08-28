var tap = require('tap')

var results = require('../run')(['--ndjson'], __dirname)

tap.equal(results.status, 0)

var output = results.stdout.trim().split('\n').map(line => JSON.parse(line))

tap.assert(
  output.some(result => result.name === 'nonexistent/symlinked' && result.approved === true)
)

tap.assert(
  output.some(result => result.version === '' && result.approved === true)
)
