@SETLOCAL
@IF NOT DEFINED NODE_PATH (
  @SET "NODE_PATH=C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\bin\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\node_modules"
) ELSE (
  @SET "NODE_PATH=C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\bin\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\node_modules;%NODE_PATH%"
)
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\bin\run" %*
) ELSE (
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\eas-cli@22.2.0_@types+node@26.2.0_typescript@5.9.3\node_modules\eas-cli\bin\run" %*
)
