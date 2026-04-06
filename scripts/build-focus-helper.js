#!/usr/bin/env node
/**
 * Builds the focus-helper binary for Windows.
 * Used by the focus tracking system to capture/restore foreground window.
 *
 * Strategy: try MSVC (cl), then MinGW (gcc), then Clang.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const isWindows = process.platform === "win32";
if (!isWindows) {
  process.exit(0);
}

const projectRoot = path.resolve(__dirname, "..");
const cSource = path.join(projectRoot, "resources", "focus-helper.c");
const outputDir = path.join(projectRoot, "resources", "bin");
const outputBinary = path.join(outputDir, "focus-helper.exe");

function log(message) {
  console.log(`[focus-helper] ${message}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isBinaryUpToDate() {
  if (!fs.existsSync(outputBinary)) return false;
  if (!fs.existsSync(cSource)) return true;
  try {
    return fs.statSync(outputBinary).mtimeMs >= fs.statSync(cSource).mtimeMs;
  } catch {
    return false;
  }
}

function quotePath(p) {
  return `"${p.replace(/"/g, '\\"')}"`;
}

function tryCompile() {
  if (!fs.existsSync(cSource)) {
    log("C source not found, cannot compile");
    return false;
  }

  const compilers = [
    {
      name: "MSVC",
      useShell: true,
      getCommand: () =>
        `cl /O2 /nologo ${quotePath(cSource)} /Fe:${quotePath(outputBinary)} user32.lib`,
    },
    {
      name: "MinGW-w64",
      useShell: false,
      command: "gcc",
      args: ["-O2", cSource, "-o", outputBinary, "-luser32"],
    },
    {
      name: "Clang",
      useShell: false,
      command: "clang",
      args: ["-O2", cSource, "-o", outputBinary, "-luser32"],
    },
  ];

  for (const compiler of compilers) {
    log(`Trying ${compiler.name}...`);
    let result;
    if (compiler.useShell) {
      result = spawnSync(compiler.getCommand(), [], {
        stdio: "inherit",
        cwd: projectRoot,
        shell: true,
      });
    } else {
      result = spawnSync(compiler.command, compiler.args, {
        stdio: "inherit",
        cwd: projectRoot,
        shell: false,
      });
    }

    if (result.status === 0 && fs.existsSync(outputBinary)) {
      log(`Successfully built with ${compiler.name}`);
      return true;
    }
    log(`${compiler.name} failed, trying next...`);
  }

  return false;
}

function main() {
  ensureDir(outputDir);

  if (isBinaryUpToDate()) {
    log("Binary is up to date, skipping build");
    return;
  }

  const compiled = tryCompile();
  if (!compiled) {
    console.warn("[focus-helper] Could not build focus-helper binary.");
    console.warn("[focus-helper] Focus tracking for floating button will not work.");
  }
}

main();
