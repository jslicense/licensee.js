var tap = require('tap')

var results = require('../run')([], __dirname)

tap.equal(results.status, 1)

tap.equal(
  results.stdout.trim(),
  [
    'mit-licensed@1.0.0',
    '  NOT APPROVED',
    '  Terms: MIT',
    '  Repository: git+https://github.com/jslicense/mit-licensed.js.git',
    '  Homepage: https://github.com/jslicense/mit-licensed.js#readme',
    '  Author: Kyle E. Mitchell <kyle@kemitchell.com> (https://kemitchell.com/)',
    '  Contributors: None listed'
  ].join('\n')
)
