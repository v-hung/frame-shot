@echo off
REM Quick rebuild and test native module

echo [1/3] Building native module...
call npm run build:native

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Native build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Testing binary directly...
echo.

set BINARY_PATH=resources\bin\frameshot-native.exe

if not exist "%BINARY_PATH%" (
    echo [ERROR] Binary not found at %BINARY_PATH%
    pause
    exit /b 1
)

echo Testing: get-window-at-cursor
"%BINARY_PATH%" get-window-at-cursor
echo.

echo Testing: list-windows
"%BINARY_PATH%" list-windows
echo.

echo [3/3] Native module is ready!
echo.
echo You can now:
echo   1. Run: npm run dev
echo   2. Navigate to Window Picker test page
echo   3. Test live window detection
echo.
pause
