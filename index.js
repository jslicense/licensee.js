module.exports = licensee

var licenseSatisfies = require('spdx-satisfies')
var readPackageTree = require('read-package-tree')
var semverMatches = require('semver').match
var tv4 = require('tv4')
var validSPDX = require('spdx-expression-validate')

var schema = require('./configuration-schema.json')

function licensee(configuration, path, callback) {
  // Check the configuration against schema.
  var validation = tv4.validateMultiple(configuration, schema)
  if (!validation.valid) {
    callback(new Error('Invalid configuration')) }
  // The schema only requires that `license` be a string.
  // Check that it is a valid SPDX license expression.
  else if (!validSPDX(configuration.license)) {
    callback(new Error('Invalid license expression')) }
  else {
    // Read the package tree from `node_modules`.
    readPackageTree(path, function(error, tree) {
      if (error) {
        callback(error) }
      else {
        callback(null, findIssues(configuration, tree, [ ])) } }) } }

function findIssues(configuration, tree, issues) {
  var dependencies = tree.children
  // If there are dependencies, check license metadata.
  if (typeof dependencies === 'object') {
    return dependencies
      .reduce(
        function(issues, tree) {
          if (!acceptablePackage(configuration, tree)) {
            issues.push({
              name: tree.package.name,
              license: tree.package.license,
              version: tree.package.version,
              parent: tree.parent,
              path: tree.path }) }
          // Recurse dependencies.
          return findIssues(configuration, tree, issues) },
        issues) }
  else {
    return issues } }

function acceptablePackage(configuration, tree) {
  var licenseExpression = configuration.license
  var whitelist = configuration.whitelist
  return (
    // Is the package on the whitelist?
    Object.keys(whitelist)
      .some(function(name) {
        return (
          ( tree.name === name ) &&
          ( semverMatches(tree.package.version, whitelist[name]) ) ) }) ||
    // Does the package's license metadata match configuration?
    ( licenseExpression &&
      validSPDX(licenseExpression) &&
      tree.package.license &&
      ( typeof tree.package.license === 'string' ) &&
      validSPDX(tree.package.license) &&
      licenseSatisfies(tree.package.license, licenseExpression) ) ) }
