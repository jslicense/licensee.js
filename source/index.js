var readInstalled = require('read-installed');
var spdx = require('spdx');

var uses = ['copy', 'link', 'modify'];

var allowAny = function() {
  return true;
};

var noError = null;

module.exports = function(packagePath, configuration, callback) {
  uses.forEach(function(use) {
    if (configuration.hasOwnProperty(use)) {
      var licenseExpression = configuration[use];
      configuration[use] = function(argument) {
        return spdx.satisfies(argument, licenseExpression);
      };
    } else {
      configuration[use] = allowAny;
    }
  });

  readInstalled(packagePath, {}, function(error, installed) {
    if (error) {
      callback(error);
    } else {
      var problems = [];
      Object.keys(installed.dependencies)
        .forEach(function(dependencyName) {
          var metadata = installed.dependencies[dependencyName];
          if (!metadata.hasOwnProperty('license')) {
            problems.push({
              package: dependencyName,
              license: null,
              message: 'no license'
            });
          } else {
            var license = metadata.license;
            if (!configuration.link(license)) {
              problems.push({
                package: dependencyName,
                license: license,
                message: 'cannot link ' + license
              });
            }
          }
        });
      callback(noError, problems);
    }
  });
};
