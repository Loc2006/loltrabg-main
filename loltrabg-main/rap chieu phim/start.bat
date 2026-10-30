@echo off
chcp 65001 >nul
title Khởi động Hệ thống Rạp Chiếu Phim OOAD
cls
echo ================================================================
echo    HỆ THỐNG QUẢN LÝ VẬN HÀNH & ĐẶT VÉ RẠP PHIM (OOAD)
echo ================================================================
echo.
echo [1/3] Kiểm tra Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Chưa cài đặt Node.js hoặc chưa thêm vào PATH!
    pause
    exit /b
)

echo [2/3] Đang khởi động Backend REST API Server (Port 5050)...
start "Cinema Backend Server (Port 5050)" cmd /k "cd /d "%~dp0backend" && node server.js"

echo [3/3] Đang khởi động Frontend Web App (Port 5173)...
start "Cinema Frontend Web (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo Đang chờ 3 giây rồi tự động mở trình duyệt...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ================================================================
echo  ✅ ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:5050
echo  - Health Check: http://localhost:5050/api/health
echo ================================================================
echo.
pause
