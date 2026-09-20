@echo off
title Reset MySQL Root Password
echo ========================================================
echo   Resetting MySQL Root Password to Abhay@2912
echo ========================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Administrator privileges required.
    echo Requesting elevation...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

echo [1/4] Stopping MySQL80 service...
net stop MySQL80 >nul 2>&1

echo [2/4] Preparing init file...
set INIT_FILE=%TEMP%\mysql_reset_init.txt
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'Abhay@2912'; > "%INIT_FILE%"
echo FLUSH PRIVILEGES; >> "%INIT_FILE%"

echo [3/4] Resetting password via mysqld...
set "MY_INI=C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
set "MYSQLD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"

start "" /B "%MYSQLD%" --defaults-file="%MY_INI%" --init-file="%INIT_FILE:\=/%"
timeout /t 6 /nobreak >nul

taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del "%INIT_FILE%" >nul 2>&1

echo [4/4] Restarting MySQL80 service...
net start MySQL80

echo.
echo ========================================================
echo SUCCESS! MySQL root password has been reset to: Abhay@2912
echo ========================================================
echo.
pause
