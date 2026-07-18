@echo off
cd /d %~dp0
echo 正在启动口算小助手服务器...
start "" "http://localhost:8000"
node server.js
pause
