@SETLOCAL
@IF NOT DEFINED NODE_PATH (
  @SET "NODE_PATH=C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules\typescript\bin\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules\typescript\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\node_modules"
) ELSE (
  @SET "NODE_PATH=C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules\typescript\bin\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules\typescript\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules;C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\node_modules;%NODE_PATH%"
)
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules\typescript\bin\tsc" %*
) ELSE (
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "C:\Users\WIN-11\AppData\Local\pnpm\global\5\.pnpm\typescript@5.9.3\node_modules\typescript\bin\tsc" %*
)
