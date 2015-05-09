
var fs = require('fs');
var licensee = require('..');
var path = require('path');
var temp = require('temp').track();

require('tap').test('missing license', function(test) {
  test.plan(2);
  temp.mkdir('test', function(error, tmp) {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({dependencies: {'a': '*'}})
    );
    fs.mkdirSync(path.join(tmp, 'node_modules'));

    var aPath = path.join(tmp, 'node_modules', 'a');
    fs.mkdirSync(aPath);
    fs.writeFileSync(
      path.join(aPath, 'package.json'),
      JSON.stringify({
        name: 'a',
        dependencies: {'b':'*'},
        license: 'MIT'
      })
    );

    fs.mkdirSync(path.join(aPath, 'node_modules'));
    var bPath = path.join(aPath, 'node_modules', 'b');
    fs.mkdirSync(bPath);
    fs.writeFileSync(
      path.join(bPath, 'package.json'),
      JSON.stringify({name: 'b'})
    );

    var configuration = {};

    licensee(tmp, configuration, function(error, problems) {
      test.error(error);
      test.strictDeepEquals(
        problems,
        [
          {
            package: 'b',
            parents: ['a'],
            license: null,
            message: 'no license'
          }
        ]
      );
    });
  });
});
