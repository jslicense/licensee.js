module.exports = run

var child = require('child_process')

function run(args, cwd) {
  child.spawnSync('npm', [ 'prune' ], { cwd: cwd })
  child.spawnSync('npm', [ 'install' ], { cwd: cwd })
  var result = child.spawnSync('../../licensee', args, { cwd: cwd })
  result.stdout = result.stdout.toString().trim()
  result.stderr = result.stderr.toString().trim()
  return result }
