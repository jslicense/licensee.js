module.exports = licensee

var licenseSatisfies = require('spdx-satisfies')
var readPackageTree = require('read-package-tree')
var satisfies = require('semver').satisfies
var validSPDX = require('spdx-expression-validate')

function licensee (configuration, path, callback) {
  if (!validConfiguration(configuration)) {
    callback(new Error('Invalid configuration'))
  } else if (!validSPDX(configuration.license)) {
    callback(new Error('Invalid license expression'))
  } else {
    // Read the package tree from `node_modules`.
    readPackageTree(path, function (error, tree) {
      if (error) callback(error)
      else callback(null, findIssues(configuration, tree, []))
    })
  }
}

function validConfiguration (configuration) {
  return (
    isObject(configuration) &&
    // Validate `license` property.
    configuration.hasOwnProperty('license') &&
    isString(configuration.license) &&
    configuration.license.length > 0 &&
    // Validate `whitelist` property.
    configuration.hasOwnProperty('whitelist') &&
    isObject(configuration.whitelist) &&
    Object.keys(configuration.whitelist)
      .every(function (key) {
        return isString(configuration.whitelist[key])
      })
  )
}

function isObject (argument) {
  return typeof argument === 'object'
}

function isString (argument) {
  return typeof argument === 'string'
}

function findIssues (configuration, tree, issues) {
  var dependencies = tree.children
  // If there are dependencies, check license metadata.
  if (typeof dependencies === 'object') {
    return dependencies
      .reduce(function (issues, tree) {
        if (!acceptablePackage(configuration, tree)) {
          issues.push({
            name: tree.package.name,
            license: tree.package.license,
            version: tree.package.version,
            parent: tree.parent,
            path: tree.path
          })
        }
        // Recurse dependencies.
        return findIssues(configuration, tree, issues)
      }, issues)
  } else return issues
}

function acceptablePackage (configuration, tree) {
  var licenseExpression = configuration.license
  var whitelist = configuration.whitelist
  return (
    // Is the package on the whitelist?
    Object.keys(whitelist).some(function (name) {
      return (
        tree.package.name === name &&
        satisfies(tree.package.version, whitelist[name]) === true
      )
    }) ||
    // Does the package's license metadata match configuration?
    (
      licenseExpression &&
      validSPDX(licenseExpression) &&
      tree.package.license &&
      typeof tree.package.license === 'string' &&
      validSPDX(tree.package.license) &&
      licenseSatisfies(tree.package.license, licenseExpression)
    )
  )
}
