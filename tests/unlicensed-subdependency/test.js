var tap = require('tap')

var results = require('../run')([], __dirname)

tap.equal(results.status, 1)

tap.equal(
  results.stdout.trim(),
  [
    'mit-licensed-depends-on-not-licensed@1.0.1',
    '  NOT APPROVED',
    '  Terms: MIT',
    '  Repository: jslicense/mit-licensed-depends-on-not-licensed.js',
    '  Homepage: None listed',
    '  Author: Kyle E. Mitchell <kyle@kemitchell.com> (https://kemitchell.com/)',
    '  Contributors: None listed',
    '',
    'not-licensed@1.0.0',
    '  NOT APPROVED',
    '  Terms: Invalid license metadata',
    '  Repository: jslicense/not-licensed.js',
    '  Homepage: None listed',
    '  Author: Kyle E. Mitchell <kyle@kemitchell.com> (https://kemitchell.com/)',
    '  Contributors: None listed'
  ].join('\n')
)
