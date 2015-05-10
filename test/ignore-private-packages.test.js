var fs = require('fs');
var licensee = require('..');
var path = require('path');
var temp = require('temp').track();

require('tap').test('ignore private packages', function(test) {
  test.plan(2);

  temp.mkdir('test', function(error, tmp) {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({
        name: 'test',
        version: '0.0.0',
        dependencies: {
          a: '*',
          '@scope/b': '*'
        }
      })
    );
    fs.mkdirSync(path.join(tmp, 'node_modules'));

    var aPath = path.join(tmp, 'node_modules', 'a');
    fs.mkdirSync(path.join(aPath));
    fs.writeFileSync(
      path.join(aPath, 'package.json'),
      JSON.stringify({
        name: 'a',
        version: '0.0.0',
        private: true
      })
    );

    var scopePath = path.join(tmp, 'node_modules', '@scope');
    var bPath = path.join(scopePath, 'b');
    fs.mkdirSync(scopePath);
    fs.mkdirSync(bPath);
    fs.writeFileSync(
      path.join(bPath, 'package.json'),
      JSON.stringify({
        name: '@scope/b',
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
