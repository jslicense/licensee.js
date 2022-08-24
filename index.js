module.exports = licensee

var Arborist = require('@npmcli/arborist')
var blueOakList = require('@blueoak/list')
var correctLicenseMetadata = require('correct-license-metadata')
var has = require('has')
var npmLicenseCorrections = require('npm-license-corrections')
var osi = require('spdx-osi')
var parse = require('spdx-expression-parse')
var satisfies = require('semver').satisfies
var spdxAllowed = require('spdx-whitelisted')

function licensee (configuration, path, callback) {
  if (!validConfiguration(configuration)) {
    return callback(new Error('Invalid configuration'))
  }
  configuration.licenses = compileLicenseAllowlist(configuration)
  configuration.licensesParsed = (configuration.licenses || [])
    .reduce(function (allowlist, element) {
      try {
        var parsed = parse(element)
        if (has(parsed, 'conjunction')) {
          throw new Error('Cannot match against "' + JSON.stringify(element) + '".')
        }
        return allowlist.concat(parsed)
      } catch (e) {
        return allowlist
      }
    }, [])
  if (
    configuration.licenses.length === 0 &&
    (!configuration.packages || Object.keys(configuration.packages).length === 0)
  ) {
    callback(new Error('No licenses or packages allowed.'))
  } else {
    var arborist = new Arborist({ path })
    arborist.loadActual({ forceActual: true })
      .then(function (tree) {
        var dependencies = Array.from(tree.inventory.values())
          .filter(function (dependency) {
            return !dependency.isProjectRoot
          })
        if (configuration.filterPackages) {
          dependencies = configuration.filterPackages(dependencies)
        }
        callback(null, findIssues(configuration, dependencies))
      })
      .catch(function (error) {
        return callback(error)
      })
  }
}

function validConfiguration (configuration) {
  return (
    isObject(configuration) &&
    has(configuration, 'licenses') &&
    isObject(configuration.licenses) &&
    has(configuration, 'packages')
      ? (
        // Validate `packages` property.
        isObject(configuration.packages) &&
        Object.keys(configuration.packages)
          .every(function (key) {
            return isString(configuration.packages[key])
          })
      ) : true
  )
}

function isObject (argument) {
  return argument && typeof argument === 'object'
}

function isString (argument) {
  return typeof argument === 'string'
}

function findIssues (configuration, dependencies) {
  var results = []
  dependencies.forEach(function (dependency) {
    if (
      configuration.productionOnly &&
      dependency.dev
    ) return
    var result = resultForPackage(configuration, dependency)
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
  })
  return results
}

function resultForPackage (configuration, tree) {
  var packageAllowlist = configuration.packages || {}
  var result = {
    name: tree.package.name,
    version: tree.version,
    license: tree.package.license,
    author: tree.package.author,
    contributors: tree.package.contributors,
    repository: tree.package.repository,
    homepage: tree.package.homepage,
    parent: tree.parent,
    path: tree.realpath
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

  result.approved = false

  var packageAllowed = Object.keys(packageAllowlist)
    .some(function (name) {
      return (
        result.name === name &&
        satisfies(result.version, packageAllowlist[name]) === true
      )
    })
  if (packageAllowed) {
    result.approved = true
    result.package = true
    return result
  }

  if (!result.license || typeof result.license !== 'string') {
    return result
  }

  var validSPDX = true
  var parsed
  try {
    parsed = parse(result.license)
  } catch (e) {
    validSPDX = false
  }

  var licenseAllowlist = configuration.licensesParsed
  // Check against licensing rule.
  var licenseAllowed = (
    validSPDX &&
    spdxAllowed(parsed, licenseAllowlist)
  )
  if (licenseAllowed) {
    result.approved = true
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

function licensesFromBlueOak (rating) {
  rating = rating.toLowerCase()
  var ids = []
  for (var index = 0; index < blueOakList.length; index++) {
    var element = blueOakList[index]
    element.licenses.forEach(function (license) {
      try {
        parse(license.id)
        ids.push(license.id)
      } catch (e) {
        // pass
      }
    })
    if (rating === element.name.toLowerCase()) break
  }
  return ids
}

function compileLicenseAllowlist (configuration) {
  var licenses = configuration.licenses
  var allowlist = []
  var spdx = licenses.spdx
  if (spdx) pushMissing(spdx, allowlist)
  var blueOak = licenses.blueOak
  if (blueOak) pushMissing(licensesFromBlueOak(blueOak), allowlist)
  if (licenses.osi) pushMissing(osi, allowlist)
  return allowlist
}

function pushMissing (source, sink) {
  source.forEach(function (element) {
    if (sink.indexOf(element) === -1) sink.push(element)
  })
}
