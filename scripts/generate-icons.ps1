$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$localSharp = Join-Path $root 'node_modules/sharp'
$bundledSharp = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'

if (Test-Path -LiteralPath $localSharp) {
  & node (Join-Path $PSScriptRoot 'generate-icons.mjs')
} elseif (Test-Path -LiteralPath $bundledSharp) {
  & node (Join-Path $PSScriptRoot 'generate-icons.mjs') $bundledSharp
} else {
  throw 'SVG rendering requires sharp. Run npm install, then retry.'
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
