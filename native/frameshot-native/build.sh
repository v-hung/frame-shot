#!/bin/bash
# Build script for macOS/Linux

echo "Building screen-capture native module..."

# Create build directory
mkdir -p build
cd build

# Run CMake
cmake .. -DCMAKE_BUILD_TYPE=Release
if [ $? -ne 0 ]; then
    echo "CMake configuration failed!"
    exit 1
fi

# Build
cmake --build .
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Install to resources/bin
cmake --install .

cd ..
echo "Build completed successfully!"
echo "Binary location: ../../resources/bin/screen-capture"
