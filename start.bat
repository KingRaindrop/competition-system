@echo off
chcp 65001 >nul
setlocal

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

if not exist "%BACKEND%\package.json" (
  echo 未找到 backend\package.json
  pause
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo 未找到 frontend\package.json
  pause
  exit /b 1
)

if not exist "%BACKEND%\node_modules" (
  echo 正在安装后端依赖...
  pushd "%BACKEND%"
  call npm install
  if errorlevel 1 (
    echo 后端依赖安装失败
    pause
    exit /b 1
  )
  popd
)

if not exist "%FRONTEND%\node_modules" (
  echo 正在安装前端依赖...
  pushd "%FRONTEND%"
  call npm install
  if errorlevel 1 (
    echo 前端依赖安装失败
    pause
    exit /b 1
  )
  popd
)

echo 正在同步数据库结构...
pushd "%BACKEND%"
call npm run db:push
if errorlevel 1 (
  echo 数据库同步失败
  pause
  exit /b 1
)
popd

echo 正在启动后端和前端...
start "竞赛管理系统-后端" cmd /k "cd /d "%BACKEND%" && npm run dev"
start "竞赛管理系统-前端" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo 已启动两个窗口：后端服务和前端服务。
echo 前端通常在 Vite 输出的地址访问，例如 http://localhost:5173
pause
