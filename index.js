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

function findIssues (configuration, tree, results) {
  var dependencies = tree.children
  // If there are dependencies, check license metadata.
  if (typeof dependencies === 'object') {
    dependencies.forEach(function (tree) {
      results.push(resultForPackage(configuration, tree))
      findIssues(configuration, tree, results)
      if (tree.hasOwnProperty('children')) {
        findIssues(configuration, tree.children, results)
      }
    })
    return results
  } else return results
}

function resultForPackage (configuration, tree) {
  var licenseExpression = configuration.license
  var whitelist = configuration.whitelist
  var result = {
    name: tree.package.name,
    license: tree.package.license,
    author: tree.package.author,
    contributors: tree.package.contributors,
    repository: tree.package.repository,
    homepage: tree.package.homepage,
    version: tree.package.version,
    parent: tree.parent,
    path: tree.path
  }
  var whitelisted = Object.keys(whitelist).some(function (name) {
    return (
      tree.package.name === name &&
      satisfies(tree.package.version, whitelist[name]) === true
    )
  })
  if (whitelisted) {
    result.approved = true
    result.whitelisted = true
  } else {
    var matchesRule = (
      licenseExpression &&
      validSPDX(licenseExpression) &&
      tree.package.license &&
      typeof tree.package.license === 'string' &&
      validSPDX(tree.package.license) &&
      licenseSatisfies(tree.package.license, licenseExpression)
    )
    if (matchesRule) {
      result.approved = true
      result.rule = true
    } else {
      result.approved = false
    }
  }
  return result
}
