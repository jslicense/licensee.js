var readInstalled = require('read-installed');
var spdx = require('spdx');

var uses = ['copy', 'link', 'modify'];

var allowAny = function() {
  return true;
};

var noError = null;

var problemsWith = function(configuration, name, metadata, parents) {
  var problems = [];
  if (metadata.private === true) {
    // pass
  } else if (!metadata.hasOwnProperty('license')) {
    problems.push({
      package: name,
      parents: parents,
      license: null,
      message: 'no license'
    });
  } else {
    var license = metadata.license;
    if (!configuration.link(license)) {
      problems.push({
        package: name,
        parents: parents,
        license: license,
        message: 'cannot link ' + license
      });
    }
  }
  var dependencies = metadata.dependencies;
  return Object.keys(dependencies)
    .reduce(function(problems, dependencyName) {
      return problems.concat(
        problemsWith(
          configuration,
          dependencyName,
          dependencies[dependencyName],
          parents.concat(name)
        )
      );
    }, problems);
};

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
      var dependencies = installed.dependencies;
      callback(
        noError,
        Object.keys(dependencies)
          .reduce(function(problems, dependencyName) {
            return problems.concat(
              problemsWith(
                configuration,
                dependencyName,
                dependencies[dependencyName],
                []
              )
            );
          }, [])
      );
    }
  });
};
