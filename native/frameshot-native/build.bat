@echo off
REM Build script for Windows

echo Building frameshot-native module...

REM Create build directory
if not exist build mkdir build
cd build

REM Run CMake
cmake .. -G "Visual Studio 17 2022" -A x64
if %errorlevel% neq 0 (
    echo CMake configuration failed!
    exit /b %errorlevel%
)

REM Build
cmake --build . --config Release
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

REM Install to resources/bin
cmake --install . --config Release

cd ..
echo Build completed successfully!
echo Binary location: ..\..\resources\bin\frameshot-native.exe
