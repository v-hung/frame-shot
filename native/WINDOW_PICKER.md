# Window Picker - Native C++ Integration

Chức năng lấy thông tin cửa sổ tại vị trí chuột sử dụng Windows API (giống SnagIt).

## Cách Test

### 1. Build Native Module (Lần đầu tiên)

```bash
npm run build:native
```

Lệnh này sẽ:

- Chạy CMake để generate Visual Studio project
- Compile C++ code thành executable
- Copy binary vào `resources/bin/screen-capture.exe`

### 2. Quick Test (Build + Test Binary)

```bash
npm run test:native
```

Lệnh này sẽ:

- Build lại native module
- Test binary trực tiếp với các command
- Hiển thị kết quả JSON

### 3. Test trong Electron

```bash
npm run dev
```

Trong ứng dụng:

1. Click vào **"Window Picker Test"** trên trang Home
2. Click **"Start Live Tracking"**
3. Di chuyển chuột qua các cửa sổ khác nhau
4. Xem thông tin cửa sổ cập nhật real-time

## API Commands

### Get Window at Cursor

```bash
screen-capture.exe get-window-at-cursor
```

Output:

```json
{
  "success": true,
  "hwnd": 123456,
  "title": "Visual Studio Code",
  "processName": "Code.exe",
  "bounds": {
    "x": 100,
    "y": 100,
    "width": 1200,
    "height": 800
  },
  "cursor": {
    "x": 500,
    "y": 300
  },
  "isVisible": true
}
```

### List All Windows

```bash
screen-capture.exe list-windows
```

Output:

```json
{
  "success": true,
  "windows": [
    {
      "hwnd": 123456,
      "title": "Window 1",
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Electron Renderer (React)                      │
│                                                 │
│  WindowPickerPage.tsx                          │
│    - UI controls                               │
│    - Live tracking (100ms polling)             │
│    - Display window info                       │
└─────────────────┬───────────────────────────────┘
                  │ IPC: window-picker:get-at-cursor
┌─────────────────▼───────────────────────────────┐
│ Electron Main Process                          │
│                                                 │
│  window-picker.handlers.ts                     │
│    └─> NativeProcessService                    │
│          - Spawn C++ process                   │
│          - Parse JSON output                   │
└─────────────────┬───────────────────────────────┘
                  │ child_process.spawn()
┌─────────────────▼───────────────────────────────┐
│ Native C++ Executable                          │
│                                                 │
│  screen-capture.exe                            │
│    - GetCursorPos()                            │
│    - WindowFromPoint()                         │
│    - GetWindowRect()                           │
│    - GetWindowText()                           │
│    - Output JSON to stdout                     │
└─────────────────────────────────────────────────┘
```

## Development Workflow

### Thay đổi C++ code:

1. Edit `native/screen-capture/src/main.cpp`
2. Run `npm run test:native` để rebuild và test
3. Restart Electron nếu đang chạy `npm run dev`

### Hot Reload (không cần restart Electron):

Hiện tại mỗi lần gọi IPC sẽ spawn process mới, nên:

- **Không cần restart Electron** sau khi rebuild native module
- Chỉ cần rebuild C++ → refresh trang test là được

### Debug Tips:

**Test binary trực tiếp:**

```bash
cd resources/bin
./screen-capture.exe get-window-at-cursor
./screen-capture.exe list-windows
```

**Check process output:**

```bash
# Trong TypeScript service có log:
console.log('[NativeProcess] Spawning:', binaryPath, args)
console.log('[NativeProcess] Exit code:', code)
```

**Kiểm tra JSON format:**

- C++ phải output valid JSON to stdout
- stderr dùng cho error messages
- Exit code 0 = success, != 0 = error

## Tích hợp vào Capture Flow

Sau khi test xong, có thể dùng window detection trong capture flow:

```typescript
// Trong capture window hoặc overlay
const windowInfo = await window.windowPickerAPI.getAtCursor()

if (windowInfo.success && windowInfo.data) {
  // Highlight window bounds
  drawHighlight(windowInfo.data.bounds)

  // Auto-select window region
  setCaptureRegion(windowInfo.data.bounds)
}
```

## Troubleshooting

### Binary not found

```
[ERROR] Binary not found at resources/bin/screen-capture.exe
```

**Solution:** Run `npm run build:native` trước

### CMake not found

```
'cmake' is not recognized as an internal or external command
```

**Solution:** Install CMake from https://cmake.org/download/

### Visual Studio not found

```
CMake Error: Could not find Visual Studio
```

**Solution:** Install Visual Studio 2022 with C++ workload

### JSON parse error

```
Failed to parse native process output
```

**Solution:** Check C++ code output format, phải là valid JSON

### Permission denied

Nếu không lấy được window info của admin processes:

- Run Electron với admin privileges, hoặc
- Skip windows that can't be accessed

## Next Steps

- [ ] Implement actual screen capture (BitBlt)
- [ ] Add thumbnail generation
- [ ] Cache window list
- [ ] Add window filtering (minimize, hidden, etc.)
- [ ] Cross-platform support (macOS/Linux)
