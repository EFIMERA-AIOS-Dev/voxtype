/**
 * Focus Helper for VoxType
 *
 * Captures or restores the foreground window handle.
 * Used by the focus tracking system to ensure dictated text
 * is pasted into the correct window when the user clicks
 * the floating dictation button (which steals focus).
 *
 * Usage:
 *   focus-helper get          → prints foreground window handle (int64)
 *   focus-helper set <hwnd>   → restores focus to the given window handle
 *
 * Compile with: cl /O2 focus-helper.c /Fe:focus-helper.exe user32.lib
 * Or with MinGW: gcc -O2 focus-helper.c -o focus-helper.exe -luser32
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: focus-helper get | focus-helper set <hwnd>\n");
        return 1;
    }

    if (strcmp(argv[1], "get") == 0) {
        HWND hwnd = GetForegroundWindow();
        printf("%lld\n", (long long)(intptr_t)hwnd);
        fflush(stdout);
        return 0;
    }

    if (strcmp(argv[1], "set") == 0 && argc >= 3) {
        long long val = atoll(argv[2]);
        HWND hwnd = (HWND)(intptr_t)val;
        BOOL ok = SetForegroundWindow(hwnd);
        printf("%s\n", ok ? "OK" : "FAILED");
        fflush(stdout);
        return ok ? 0 : 1;
    }

    fprintf(stderr, "Unknown command: %s\n", argv[1]);
    return 1;
}
