module.exports = licensee

var licenseSatisfies = require('spdx-satisfies')
var validSPDX = require('spdx-expression-validate')
var readIntalled = require('read-installed')
var semverMatches = require('semver').match
var tv4 = require('tv4')

var schema = require('./schema.json')

function licensee(configuration, path, callback) {
  var validation = tv4.validateMultiple(configuration, schema)
  if (!validation.valid) {
    callback(new Error('Invalid configuration')) }
  else if (!validSPDX(configuration.license)) {
    callback(new Error('Invalid license expression')) }
  else {
    readIntalled(path, { dev: false }, function(error, data) {
      if (error) {
        callback(error) }
      else {
        callback(null, findIssues(configuration, data, [ ])) } }) } }

function findIssues(configuration, data, issues) {
  var dependencies = data.dependencies
  if (typeof data.dependencies === 'object') {
    return Object.keys(dependencies)
      .reduce(
        function(issues, name) {
          var data = dependencies[name]
          if (!acceptablePackage(configuration, data)) {
            issues.push({
              name: data.name,
              license: data.license,
              parent: data.parent,
              path: data.path }) }
          return findIssues(configuration, data, issues) },
        issues) }
  else {
    return issues } }

function acceptablePackage(configuration, data) {
  var licenseExpression = configuration.license
  var whitelist = configuration.whitelist
  return (
    Object.keys(whitelist)
      .some(function(name) {
        return (
          ( data.name === name ) &&
          ( semverMatches(data.version, whitelist[name]) ) ) }) ||
    ( licenseExpression &&
      validSPDX(licenseExpression) &&
      data.license &&
      ( typeof data.license === 'string' ) &&
      validSPDX(data.license) &&
      licenseSatisfies(data.license, licenseExpression) ) ) }
