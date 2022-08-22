var fs = require('fs')
var runParallel = require('run-parallel')
var mod = require('../')
var os = require('os')
var path = require('path')
var rimraf = require('rimraf')
var tap = require('tap')

tap.test('unit', function (test) {
  fs.mkdtemp(path.join(os.tmpdir(), 'licensee-test-'), function (error, directory) {
    test.ifError(error, 'mkdtemp')
    var nodeModulesPath = path.join(directory, 'node_modules')
    fs.mkdir(nodeModulesPath, function (error) {
      test.ifError(error, 'mkdir node_modules')
      runParallel([
        function (done) {
          fs.writeFile(
            path.join(directory, 'package.json'),
            JSON.stringify({
              name: 'licensee-test',
              version: '1.0.0',
              private: true,
              dependencies: { a: '1.0.0', b: '1.0.0' }
            }, null, 2),
            done
          )
        },
        function (done) {
          writeFakePackage(nodeModulesPath, 'a', 'MIT', done)
        },
        function (done) {
          writeFakePackage(nodeModulesPath, 'b', 'GPL-2.0-only', done)
        }
      ], function (error) {
        test.ifError(error, 'write fake deps')
        var configuration = {
          licenses: { blueOak: 'bronze' }
        }
        mod(configuration, directory, function (error, results) {
          test.ifError(error, 'no invocation error')
          test.assert(
            results.some(function (result) {
              return result.name === 'a' && result.approved === true
            }),
            'approves MIT'
          )
          test.assert(
            results.some(function (result) {
              return result.name === 'b' && result.approved === false
            }),
            'rejects GPL-2.0-only'
          )
          rimraf(directory, function (error) {
            test.ifError(error, 'rm -rf test dir')
            test.end()
          })
        })
      })
    })
  })
})

function writeFakePackage (nodeModulesPath, name, license, callback) {
  var packagePath = path.join(nodeModulesPath, name)
  fs.mkdir(packagePath, function (error) {
    if (error) return callback(error)
    runParallel([
      function (done) {
        fs.writeFile(
          path.join(packagePath, 'index.js'),
          `module.exports = function () { console.log("${name}") }`,
          done
        )
      },
      function (done) {
        fs.writeFile(
          path.join(packagePath, 'package.json'),
          JSON.stringify({
            name,
            version: '1.0.0',
            author: `Author of ${name}`,
            contributors: [`Contributor to ${name}`],
            repository: `http://example.com/${name}/repo`,
            homepage: `http://example.com/${name}`,
            license
          }, null, 2),
          done
        )
      }
    ], callback)
  })
}
