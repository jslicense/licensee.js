var fs = require('fs');
var licensee = require('..');
var path = require('path');
var temp = require('temp').track();

require('tap').test('missing license', function(test) {
  test.plan(2);

  temp.mkdir('test', function(error, tmp) {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({
        name: 'test',
        version: '0.0.0',
        dependencies: {
          a: '*'
        }
      })
    );
    fs.mkdirSync(path.join(tmp, 'node_modules'));

    var aPath = path.join(tmp, 'node_modules', 'a');
    fs.mkdirSync(aPath);
    fs.writeFileSync(
      path.join(aPath, 'package.json'),
      JSON.stringify({
        name: 'a',
        version: '0.0.0'
      })
    );

    var configuration = {};

    licensee(tmp, configuration, function(error, problems) {
      test.error(error);
      test.strictDeepEquals(problems, [{
        package: 'a',
        parents: [],
        license: null,
        message: 'no license'
      }]);
    });
  });
});
