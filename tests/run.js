module.exports = run

var spawnSync = require('spawn-sync')

function run (args, cwd) {
  spawnSync('npm', ['ci'], { cwd: cwd })
  var result = spawnSync('../../licensee', args, { cwd: cwd })
  result.stdout = result.stdout.toString().trim()
  result.stderr = result.stderr.toString().trim()
  return result
}
