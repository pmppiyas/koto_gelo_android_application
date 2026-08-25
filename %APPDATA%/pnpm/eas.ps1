#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe=""
$pathsep=":"
$env_node_path=$env:NODE_PATH
$new_node_path="C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\bin\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\node_modules"
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux builds of Node
  # are installed in the same directory
  $exe=".exe"
  $pathsep=";"
} else {
  $new_node_path="/mnt/c/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules/eas-cli/bin/node_modules:/mnt/c/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules/eas-cli/node_modules:/mnt/c/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules:/mnt/c/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/node_modules"
}
if ([string]::IsNullOrEmpty($env_node_path)) {
  $env:NODE_PATH=$new_node_path
} else {
  $env:NODE_PATH="$new_node_path$pathsep$env_node_path"
}

$ret=0
if (Test-Path "$basedir/node$exe") {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "$basedir/node$exe"  "C:/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules/eas-cli/bin/run" $args
  } else {
    & "$basedir/node$exe"  "C:/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules/eas-cli/bin/run" $args
  }
  $ret=$LASTEXITCODE
} else {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "node$exe"  "C:/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules/eas-cli/bin/run" $args
  } else {
    & "node$exe"  "C:/Users/WIN-11/AppData/Local/pnpm/global/5/.pnpm/eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3/node_modules/eas-cli/bin/run" $args
  }
  $ret=$LASTEXITCODE
}
$env:NODE_PATH=$env_node_path
exit $ret
