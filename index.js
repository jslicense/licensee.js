module.exports = licensee

var blueOakList = require('@blueoak/list')
var correctLicenseMetadata = require('correct-license-metadata')
var licenseSatisfies = require('spdx-satisfies')
var npmLicenseCorrections = require('npm-license-corrections')
var parseJSON = require('json-parse-errback')
var readPackageTree = require('read-package-tree')
var runParallel = require('run-parallel')
var satisfies = require('semver').satisfies
var simpleConcat = require('simple-concat')
var spawn = require('child_process').spawn
var validSPDX = require('spdx-expression-validate')

function licensee (configuration, path, callback) {
  if (!validConfiguration(configuration)) {
    return callback(new Error('Invalid configuration'))
  }
  if (configuration.license) {
    configuration.rule = configuration.license
  } else {
    configuration.rule = licenseRuleFromBlueOak(configuration.blueOak)
  }
  if (!validSPDX(configuration.rule)) {
    console.log(configuration.rule)
    callback(new Error('Invalid license expression'))
  } else {
    if (configuration.productionOnly) {
      // In order to ignore devDependencies, we need to read:
      //
      // 1. the dependencies-only dependency graph, from
      //    `npm ls --json --production`
      //
      // 2. the structure of `node_modules` and `package.json`
      //    files within it, with read-package-tree.
      //
      // `npm ls` calls read-package-tree internally, but does
      // lots of npm-specific post-processing to produce the
      // dependency tree.  Calling read-package-tree twice, at
      // the same time, is far from efficient.  But it works,
      // and doing so helps keep this package small.
      runParallel({
        dependencies: readDependencyList,
        packages: readFilesystemTree
      }, function (error, trees) {
        if (error) callback(error)
        else withTrees(trees.packages, trees.dependencies)
      })
    } else {
      // If we are analyzing _all_ installed dependencies,
      // and don't care whether they're devDependencies
      // or not, just read `node_modules`.  We don't need
      // the dependency graph.
      readFilesystemTree(function (error, packages) {
        if (error) callback(error)
        else withTrees(packages, false)
      })
    }
  }

  function withTrees (packages, dependencies) {
    callback(null, findIssues(
      configuration, packages, dependencies, []
    ))
  }

  function readDependencyList (done) {
    var child = spawn(
      'npm', ['ls', '--production', '--json'], { cwd: path }
    )
    var outputError
    var json
    simpleConcat(child.stdout, function (error, buffer) {
      if (error) outputError = error
      else json = buffer
    })
    child.once('close', function (code) {
      if (code !== 0) {
        done(new Error('npm exited with status ' + code))
      } else if (outputError) {
        done(outputError)
      } else {
        parseJSON(json, function (error, graph) {
          if (error) return done(error)
          if (!graph.hasOwnProperty('dependencies')) {
            done(new Error('cannot interpret npm ls --json output'))
          } else {
            var flattened = {}
            flattenDependencyTree(graph.dependencies, flattened)
            done(null, flattened)
          }
        })
      }
    })
  }

  function readFilesystemTree (done) {
    readPackageTree(path, function (error, tree) {
      if (error) return done(error)
      done(null, tree.children)
    })
  }
}

var KEY_PREFIX = '.'

function flattenDependencyTree (graph, object) {
  Object.keys(graph).forEach(function (name) {
    var node = graph[name]
    var version = node.version
    var key = KEY_PREFIX + name
    if (
      object.hasOwnProperty(key) &&
      object[key].indexOf(version) === -1
    ) {
      object[key].push(version)
    } else {
      object[key] = [version]
    }
    if (node.hasOwnProperty('dependencies')) {
      flattenDependencyTree(node.dependencies, object)
    }
  })
}

function validConfiguration (configuration) {
  return (
    isObject(configuration) &&
    XOR(
      configuration.license,
      configuration.blueOak
    ),
    XOR(
      ( // Validate `license` property.
        configuration.hasOwnProperty('license') &&
        isString(configuration.license) &&
        configuration.license.length > 0
      ),
      ( // Validate Blue Oak rating.
        configuration.hasOwnProperty('blueOak') &&
        isString(configuration.blueOak) &&
        configuration.blueOak.length > 0 &&
        blueOakList.some(function (element) {
          return element.name === configuration.blueOak.toLowerCase()
        })
      )
    ) &&
    configuration.hasOwnProperty('whitelist')
      ? (
        // Validate `whitelist` property.
        isObject(configuration.whitelist) &&
        Object.keys(configuration.whitelist)
          .every(function (key) {
            return isString(configuration.whitelist[key])
          })
      ) : true
  )
}

function XOR (a, b) {
  return (a || b) && !(a && b)
}

function isObject (argument) {
  return typeof argument === 'object'
}

function isString (argument) {
  return typeof argument === 'string'
}

function findIssues (configuration, children, dependencies, results) {
  if (Array.isArray(children)) {
    children.forEach(function (child) {
      if (
        !configuration.productionOnly ||
        appearsIn(child, dependencies)
      ) {
        var result = resultForPackage(configuration, child)
        // Deduplicate.
        var existing = results.find(function (existing) {
          return (
            existing.name === result.name &&
            existing.version === result.version
          )
        })
        if (existing) {
          if (existing.duplicates) {
            existing.duplicates.push(result)
          } else {
            existing.duplicates = [result]
          }
        } else {
          results.push(result)
        }
        findIssues(configuration, child, dependencies, results)
      }
      if (child.children) {
        findIssues(configuration, child.children, dependencies, results)
      }
    })
    return results
  } else return results
}

function appearsIn (installed, dependencies) {
  var name = installed.package.name
  var key = KEY_PREFIX + name
  var version = installed.package.version
  return (
    dependencies.hasOwnProperty(key) &&
    dependencies[key].indexOf(version) !== -1
  )
}

function resultForPackage (configuration, tree) {
  var rule = configuration.rule
  var whitelist = configuration.whitelist || {}
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

  // Find and apply any manual license metadata correction.
  var manualCorrection = (
    configuration.corrections &&
    npmLicenseCorrections.find(function (correction) {
      return (
        correction.name === result.name &&
        correction.version === result.version
      )
    })
  )
  if (manualCorrection) {
    result.license = manualCorrection.license
    result.corrected = 'manual'
  }

  // Find and apply any automatic license metadata correction.
  var automaticCorrection = (
    configuration.corrections &&
    correctLicenseMetadata(tree.package)
  )
  if (automaticCorrection) {
    result.license = automaticCorrection
    result.corrected = 'automatic'
  }

  // Check if ignored.
  var ignore = configuration.ignore
  if (ignore && Array.isArray(ignore)) {
    var ignored = ignore.some(function (ignore) {
      if (typeof ignore !== 'object') return false
      if (
        ignore.prefix &&
        typeof ignore.prefix === 'string' &&
        startsWith(result.name, ignore.prefix)
      ) return true
      if (
        ignore.scope &&
        typeof ignore.scope === 'string' &&
        startsWith(result.name, '@' + ignore.scope + '/')
      ) return true
      if (
        ignore.author &&
        typeof ignore.author === 'string' &&
        personMatches(result.author, ignore.author)
      ) return true
      return false
    })
    if (ignored) {
      result.approved = true
      result.ignored = ignored
      return result
    }
  }

  // Check if whitelisted.
  var whitelisted = Object.keys(whitelist).some(function (name) {
    return (
      result.name === name &&
      satisfies(result.version, whitelist[name]) === true
    )
  })
  if (whitelisted) {
    result.approved = true
    result.whitelisted = true
    return result
  }

  // Check against licensing rule.
  var matchesRule = (
    rule &&
    validSPDX(rule) &&
    result.license &&
    typeof result.license === 'string' &&
    validSPDX(result.license) &&
    licenseSatisfies(result.license, rule)
  )
  if (matchesRule) {
    result.approved = true
    result.rule = true
  } else {
    result.approved = false
  }
  return result
}

function startsWith (string, prefix) {
  return string.toLowerCase().indexOf(prefix.toLowerCase()) === 0
}

function personMatches (person, string) {
  if (!person) return false
  if (typeof person === 'string') {
    return contains(person, string)
  }
  if (typeof person === 'object') {
    if (matches('name')) return true
    if (matches('email')) return true
    if (matches('url')) return true
  }
  return false

  function matches (key) {
    return (
      person[key] &&
      typeof person[key] === 'string' &&
      contains(person[key], string)
    )
  }
}

function contains (string, substring) {
  return string.toLowerCase().indexOf(substring.toLowerCase()) !== -1
}

function licenseRuleFromBlueOak (rating) {
  rating = rating.toLowerCase()
  var ids = []
  for (var index = 0; index < blueOakList.length; index++) {
    var element = blueOakList[index]
    if (element.name.toLowerCase() === 'model') continue
    element.licenses.forEach(function (license) {
      if (validSPDX(license.id)) ids.push(license.id)
    })
    if (rating === element.name) break
  }
  return '(' + ids.join(' OR ') + ')'
}
