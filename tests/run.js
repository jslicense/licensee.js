module.exports = run

var spawnSync = require('spawn-sync')

function run (args, cwd) {
  spawnSync('npm', ['prune'], {cwd: cwd})
  spawnSync('npm', ['install'], {cwd: cwd})
  var result = spawnSync('../../licensee', args, {cwd: cwd})
  result.stdout = result.stdout.toString().trim()
  result.stderr = result.stderr.toString().trim()
  return result
}
