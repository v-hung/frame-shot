# Native C++ Modules

This directory contains native C++ executables that can be called from Electron.

## Building

### Windows

```bash
cd native/screen-capture
build.bat
```

### macOS/Linux

```bash
cd native/screen-capture
chmod +x build.sh
./build.sh
```

## Requirements

### Windows

- Visual Studio 2022 (or 2019)
- CMake 3.15+

### macOS

- Xcode Command Line Tools
- CMake 3.15+

### Linux

- GCC/G++ compiler
- CMake 3.15+
- X11 development libraries: `sudo apt-get install libx11-dev`

## Usage from Electron

```typescript
import { spawn } from 'child_process'
import { join } from 'path'

const binaryPath = join(__dirname, '../../resources/bin/screen-capture.exe')

const child = spawn(binaryPath, [
  '--mode',
  'region',
  '--x',
  '100',
  '--y',
  '100',
  '--width',
  '800',
  '--height',
  '600',
  '--output',
  'screenshot.png'
])

child.stdout.on('data', (data) => {
  const result = JSON.parse(data.toString())
  console.log('Capture result:', result)
})
```

## Packaging with electron-builder

The compiled binaries in `resources/bin/` will be automatically included in the packaged app.
