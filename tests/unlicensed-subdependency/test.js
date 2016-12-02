var tap = require('tap')

var results = require('../run')([], __dirname)

tap.equal(results.status, 1)

tap.equal(
  results.stdout.trim(),
  [
    'mit-licensed-depends-on-not-licensed@1.0.1',
    '  NOT APPROVED',
    '  Terms: MIT',
    '  Repository: git+https://github.com/jslicense/mit-licensed-depends-on-not-licensed.js.git',
    '  Homepage: https://github.com/jslicense/mit-licensed-depends-on-not-licensed.js#readme',
    '  Author: Kyle E. Mitchell <kyle@kemitchell.com> (https://kemitchell.com/)',
    '  Contributors: None listed',
    '',
    'not-licensed@1.0.0',
    '  NOT APPROVED',
    '  Terms: Invalid license metadata',
    '  Repository: git+https://github.com/jslicense/not-licensed.js.git',
    '  Homepage: https://github.com/jslicense/not-licensed.js#readme',
    '  Author: Kyle E. Mitchell <kyle@kemitchell.com> (https://kemitchell.com/)',
    '  Contributors: None listed'
  ].join('\n')
)
