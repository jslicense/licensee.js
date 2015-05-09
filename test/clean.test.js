var fs = require('fs');
var licensee = require('..');
var path = require('path');
var temp = require('temp').track();

require('tap').test('clean', function(test) {
  test.plan(2);

  temp.mkdir('test', function(error, tmp) {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({
        name: 'test',
        version: '0.0.0'
      })
    );

    var configuration = {};

    licensee(tmp, configuration, function(error, problems) {
      test.error(error);
      test.strictDeepEquals(problems, []);
    });
  });
});
