#include <iostream>
#include <vector>
#include <string>
#include <windows.h>
#include <dwmapi.h>
#include <algorithm>

#pragma comment(lib, "dwmapi.lib")

struct State {
    std::vector<std::string> windowsJson;
    HRGN hOccupiedRgn;
    int screenH; // Chiều cao giới hạn (Taskbar/Monitor)
};

std::string WStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return "";
    int size = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size, NULL, NULL);
    return strTo;
}

BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam) {
    State* state = (State*)lParam;

    if (!IsWindowVisible(hwnd) || IsIconic(hwnd)) return TRUE;

    // 1. Lấy tọa độ thực (DWM) - Đây là tọa độ chuẩn xác nhất nhìn thấy trên màn hình
    RECT wr;
    if (FAILED(DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, &wr, sizeof(RECT)))) {
        GetWindowRect(hwnd, &wr);
    }

    long x = wr.left;
    long y = wr.top;
    long w = wr.right - wr.left;
    long h = wr.bottom - wr.top;

    // 2. LOẠI BỎ PICKER (Nếu nó to bằng hoặc hơn màn hình hiện tại)
    if (w >= GetSystemMetrics(SM_CXSCREEN) && h >= state->screenH) return TRUE;

    // 3. Lọc tiêu đề
    wchar_t titleW[256];
    if (GetWindowTextW(hwnd, titleW, 256) <= 0) return TRUE;

    // 4. Occlusion Culling
    HRGN hCurRgn = CreateRectRgn(wr.left, wr.top, wr.right, wr.bottom);
    HRGN hResultRgn = CreateRectRgn(0, 0, 0, 0);
    if (CombineRgn(hResultRgn, hCurRgn, state->hOccupiedRgn, RGN_DIFF) == NULLREGION) {
        DeleteObject(hCurRgn);
        DeleteObject(hResultRgn);
        return TRUE;
    }
    CombineRgn(state->hOccupiedRgn, state->hOccupiedRgn, hCurRgn, RGN_OR);
    DeleteObject(hCurRgn);
    DeleteObject(hResultRgn);

    // 5. Xử lý Process Name
    DWORD pid;
    GetWindowThreadProcessId(hwnd, &pid);
    std::string procName = "unknown";
    HANDLE hProc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
    if (hProc) {
        wchar_t path[MAX_PATH];
        DWORD sz = MAX_PATH;
        if (QueryFullProcessImageNameW(hProc, 0, path, &sz)) {
            std::wstring ws(path);
            size_t pos = ws.find_last_of(L"\\");
            procName = WStringToString(pos != std::wstring::npos ? ws.substr(pos + 1) : ws);
        }
        CloseHandle(hProc);
    }

    // 6. Tính toán đồng nhất Client & Window Bounds
    // Ta sử dụng tọa độ Window làm gốc để tránh lệch pixel
    long clientX = x;
    long clientY = y;
    long clientW = w;
    long clientH = h;

    // Offset cho trình duyệt
    std::string lowProc = procName;
    std::transform(lowProc.begin(), lowProc.end(), lowProc.begin(), ::tolower);
    if (lowProc.find("chrome") != std::string::npos || lowProc.find("msedge") != std::string::npos) {
        UINT dpi = GetDpiForWindow(hwnd);
        int offset = MulDiv(80, dpi, 96);
        clientY += offset;
        clientH -= offset;
    }

    // 7. LOGIC CẮT HEIGHT (Clipping)
    // Nếu Y + H vượt quá giới hạn màn hình (thường là 1032 hoặc 1040)
    if (y + h > state->screenH) {
        h = state->screenH - y;
    }
    if (clientY + clientH > state->screenH) {
        clientH = state->screenH - clientY;
    }

    // Đảm bảo không bị số âm
    if (h < 0) h = 0;
    if (clientH < 0) clientH = 0;

    char buf[2048];
    snprintf(buf, sizeof(buf),
        "{\"hwnd\":%llu,\"title\":\"%s\",\"processName\":\"%s\","
        "\"windowBounds\":{\"x\":%ld,\"y\":%ld,\"width\":%ld,\"height\":%ld},"
        "\"clientBounds\":{\"x\":%ld,\"y\":%ld,\"width\":%ld,\"height\":%ld}}",
        (unsigned long long)hwnd, WStringToString(titleW).c_str(), procName.c_str(),
        x, y, w, h,
        clientX, clientY, clientW, clientH);

    state->windowsJson.push_back(buf);
    return TRUE;
}

int main(int argc, char* argv[]) {
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);

    State state;
    state.hOccupiedRgn = CreateRectRgn(0, 0, 0, 0);

    // Lấy vùng làm việc thực tế (thường là 1032 trên màn hình 1080)
    RECT workArea;
    SystemParametersInfo(SPI_GETWORKAREA, 0, &workArea, 0);
    state.screenH = workArea.bottom;

    if (argc >= 2 && std::string(argv[1]) == "list-windows") {
        EnumWindows(EnumWindowsProc, (LPARAM)&state);

        std::cout << "{\"success\":true,\"windows\":[";
        for (size_t i = 0; i < state.windowsJson.size(); i++) {
            std::cout << state.windowsJson[i] << (i == state.windowsJson.size() - 1 ? "" : ",");
        }
        std::cout << "]}" << std::endl;
    }

    DeleteObject(state.hOccupiedRgn);
    return 0;
}
