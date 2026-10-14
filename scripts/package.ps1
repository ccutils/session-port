$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$manifest = Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$manifest.version
if ($version -notmatch '^\d+(\.\d+){0,3}$') { throw 'Invalid manifest version.' }

$files = @(
  'manifest.json', 'popup.html', 'popup.js', 'options.html', 'options.js',
  'common.js', 'i18n.js', 'data-editor.js', 'background.js', 'bootstrap.js',
  'styles.css', 'LICENSE'
)
$directories = @('icons', '_locales')
foreach ($item in ($files + $directories)) {
  if (-not (Test-Path -LiteralPath (Join-Path $root $item))) { throw "Missing extension asset: $item" }
}

$dist = [System.IO.Path]::GetFullPath((Join-Path $root 'dist'))
$staging = [System.IO.Path]::GetFullPath((Join-Path $dist "session-port-$version"))
$archive = Join-Path $dist "session-port-$version.zip"
if (-not $staging.StartsWith($dist + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'The package directory must remain inside dist.'
}
if (Test-Path -LiteralPath $staging) {
  $resolvedStaging = (Resolve-Path -LiteralPath $staging).Path
  if ($resolvedStaging -ne $staging) { throw 'Unexpected package directory path.' }
  Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging -Force | Out-Null
foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination $staging
}
foreach ($directory in $directories) {
  Copy-Item -LiteralPath (Join-Path $root $directory) -Destination $staging -Recurse
}
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $archive -Force
Write-Output "Unpacked extension: $staging"
Write-Output "Release ZIP: $archive"
