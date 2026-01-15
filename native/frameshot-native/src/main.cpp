/**
 * FrameShot Native Module
 * Windows API for window detection and screen capture
 */

#include <iostream>
#include <string>
#include <vector>
#include <windows.h>
#include <dwmapi.h>
#include <sstream>

#pragma comment(lib, "dwmapi.lib")

/**
 * Get window at cursor position
 */
void getWindowAtCursor() {
    POINT cursorPos;
    GetCursorPos(&cursorPos);

    HWND hwnd = WindowFromPoint(cursorPos);

    if (hwnd == NULL) {
        std::cout << "{\"success\": false, \"error\": \"No window found at cursor position\"}";
        return;
    }

    // Get root window (not child controls)
    HWND rootHwnd = GetAncestor(hwnd, GA_ROOT);
    if (rootHwnd != NULL) {
        hwnd = rootHwnd;
    }

    // Get window title
    char windowTitle[256] = {0};
    GetWindowTextA(hwnd, windowTitle, sizeof(windowTitle));

    // Get window rect
    RECT rect;
    GetWindowRect(hwnd, &rect);

    // Get process name
    DWORD processId;
    GetWindowThreadProcessId(hwnd, &processId);

    HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
    char processName[MAX_PATH] = "Unknown";
    if (hProcess) {
        DWORD size = MAX_PATH;
        QueryFullProcessImageNameA(hProcess, 0, processName, &size);
        CloseHandle(hProcess);

        // Extract just the filename
        char* filename = strrchr(processName, '\\');
        if (filename) {
            memmove(processName, filename + 1, strlen(filename));
        }
    }

    // Check if window is visible
    bool isVisible = IsWindowVisible(hwnd) != 0;

    // Output JSON
    std::cout << "{";
    std::cout << "\"success\": true,";
    std::cout << "\"hwnd\": " << reinterpret_cast<uintptr_t>(hwnd) << ",";
    std::cout << "\"title\": \"" << windowTitle << "\",";
    std::cout << "\"processName\": \"" << processName << "\",";
    std::cout << "\"bounds\": {";
    std::cout << "\"x\": " << rect.left << ",";
    std::cout << "\"y\": " << rect.top << ",";
    std::cout << "\"width\": " << (rect.right - rect.left) << ",";
    std::cout << "\"height\": " << (rect.bottom - rect.top);
    std::cout << "},";
    std::cout << "\"cursor\": {";
    std::cout << "\"x\": " << cursorPos.x << ",";
    std::cout << "\"y\": " << cursorPos.y;
    std::cout << "},";
    std::cout << "\"isVisible\": " << (isVisible ? "true" : "false");
    std::cout << "}" << std::endl;
}

/**
 * Struct to hold enumeration state
 */
struct EnumWindowsState {
    std::vector<std::string>* windows;
    int zIndex;
};

/**
 * Callback for EnumWindows
 * EnumWindows enumerates in Z-order (top-most first)
 */
BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam) {
    if (!IsWindowVisible(hwnd)) {
        return TRUE;
    }

    char windowTitle[256] = {0};
    GetWindowTextA(hwnd, windowTitle, sizeof(windowTitle));

    if (strlen(windowTitle) == 0) {
        return TRUE;
    }

    // Get visible window bounds (excluding invisible borders)
    RECT rect;
    HRESULT hr = DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, &rect, sizeof(RECT));

    // Fallback to GetWindowRect if DWM fails
    if (FAILED(hr)) {
        GetWindowRect(hwnd, &rect);
    }

    // Skip too small windows
    if ((rect.right - rect.left) < 50 || (rect.bottom - rect.top) < 50) {
        return TRUE;
    }

    EnumWindowsState* state = reinterpret_cast<EnumWindowsState*>(lParam);

    std::stringstream ss;
    ss << "{";
    ss << "\"hwnd\": " << reinterpret_cast<uintptr_t>(hwnd) << ",";
    ss << "\"title\": \"" << windowTitle << "\",";
    ss << "\"x\": " << rect.left << ",";
    ss << "\"y\": " << rect.top << ",";
    ss << "\"width\": " << (rect.right - rect.left) << ",";
    ss << "\"height\": " << (rect.bottom - rect.top) << ",";
    ss << "\"zIndex\": " << state->zIndex;  // Higher = on top
    ss << "}";

    state->windows->push_back(ss.str());
    state->zIndex--;  // Decrement for next window (lower z-order)

    return TRUE;
}

/**
 * List all visible windows
 */
void listWindows() {
    std::vector<std::string> windows;
    EnumWindowsState state;
    state.windows = &windows;
    state.zIndex = 10000;  // Start with high number (top-most window)

    EnumWindows(EnumWindowsProc, reinterpret_cast<LPARAM>(&state));

    std::cout << "{\"success\": true, \"windows\": [";
    for (size_t i = 0; i < windows.size(); i++) {
        std::cout << windows[i];
        if (i < windows.size() - 1) {
            std::cout << ",";
        }
    }
    std::cout << "]}" << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "{\"success\": false, \"error\": \"No command specified. Usage: frameshot-native <command>\"}";
        return 1;
    }

    std::string command = argv[1];

    if (command == "get-window-at-cursor") {
        getWindowAtCursor();
    }
    else if (command == "list-windows") {
        listWindows();
    }
    else {
        std::cout << "{\"success\": false, \"error\": \"Unknown command: " << command << "\"}";
        return 1;
    }

    return 0;
}
