const { spawn, execFile } = require("child_process");
const fs = require("fs");
const os = require("os");

/**
 * Cross-platform wrapper around the NAPS2 console CLI.
 *
 * NAPS2 (https://www.naps2.com) ships a console/CLI mode on all three
 * platforms, just invoked slightly differently:
 *   - Windows: NAPS2.Console.exe <args>
 *   - macOS:   /Applications/NAPS2.app/Contents/MacOS/NAPS2 console <args>
 *   - Linux:   naps2 console <args>            (deb/rpm install, on PATH)
 *
 * Each platform also has a different default driver:
 *   - Windows -> wia
 *   - macOS   -> apple
 *   - Linux   -> sane
 */
class Naps2Engine {
  constructor() {
    this.platform = os.platform();
    this.currentProcess = null;
  }

  /**
   * Resolve the executable + any fixed leading args ("console") needed to
   * invoke the NAPS2 CLI on the current platform.
   * Returns null if NAPS2 could not be located.
   */
  resolveCommand() {
    switch (this.platform) {
      case "win32": {
        const candidates = [
          "C:\\Program Files\\NAPS2\\NAPS2.Console.exe",
          "C:\\Program Files (x86)\\NAPS2\\NAPS2.Console.exe",
        ];

        const exe = candidates.find((p) => fs.existsSync(p));

        return exe ? { exe, baseArgs: [] } : null;
      }

      case "darwin": {
        const exe = "/Applications/NAPS2.app/Contents/MacOS/NAPS2";

        return fs.existsSync(exe) ? { exe, baseArgs: ["console"] } : null;
      }

      default: {
        // Linux: naps2 is installed via deb/rpm/flatpak and placed on PATH.
        // We can't cheaply check PATH synchronously here, so we let the
        // spawn fail (ENOENT) and surface a clear error from exec() below.
        return { exe: "naps2", baseArgs: ["console"] };
      }
    }
  }

  defaultDriver() {
    switch (this.platform) {
      case "win32":
        return "wia";
      case "darwin":
        return "apple";
      default:
        return "sane";
    }
  }

  isBusy() {
    return this.currentProcess !== null;
  }

  exec(args = []) {
    return new Promise((resolve, reject) => {
      const cmd = this.resolveCommand();

      if (!cmd) {
        return reject(new Error("NAPS2 is not installed."));
      }

      if (this.currentProcess) {
        return reject(new Error("A scan is already in progress."));
      }

      // Using spawn() (not execFile()) so we get a live handle to the
      // process while it's running - required to support cancel().
      //
      // detached: true on POSIX gives the child its own process group id,
      // so cancel() can kill the whole group (NAPS2 + any SANE/ICA helper
      // process it launches) in one shot via process.kill(-pid). Windows
      // doesn't have this concept, so cancel() uses `taskkill /T` there
      // instead (see cancel() below).
      const child = spawn(cmd.exe, [...cmd.baseArgs, ...args], {
        detached: this.platform !== "win32",
      });

      let stdout = "";
      let stderr = "";
      let cancelled = false;

      child.stdout.on("data", (chunk) => (stdout += chunk));
      child.stderr.on("data", (chunk) => (stderr += chunk));

      child.on("error", (err) => {
        this.currentProcess = null;

        if (err.code === "ENOENT") {
          return reject(new Error("NAPS2 is not installed or not on PATH."));
        }

        reject(err);
      });

      child.on("close", (code) => {
        this.currentProcess = null;

        if (cancelled) {
          return reject(new Error("Scan was cancelled."));
        }

        if (code !== 0) {
          return reject(
            new Error(stderr.trim() || `NAPS2 exited with code ${code}`),
          );
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      this.currentProcess = {
        child,
        markCancelled: () => {
          cancelled = true;
        },
      };
    });
  }

  /**
   * Kill the in-flight scan, if any. Safe to call when nothing is running.
   */
  cancel() {
    if (!this.currentProcess) {
      return { cancelled: false, message: "No scan in progress." };
    }

    const { child, markCancelled } = this.currentProcess;

    markCancelled();

    if (this.platform === "win32") {
      // A plain child.kill() often leaves NAPS2's own helper processes
      // running on Windows. taskkill /T kills the whole process tree.
      execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], () => {});
    } else {
      // Negative pid = kill the whole detached process group, not just
      // the immediate NAPS2 process.
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch (err) {
        child.kill("SIGTERM");
      }
    }

    return { cancelled: true };
  }

  async version() {
    return await this.exec(["--version"]);
  }

  async listDevices(driver = null) {
    driver = driver || this.defaultDriver();

    const args = ["--listdevices", "--verbose"];

    if (driver) {
      args.push("--driver", driver);
    }

    const result = await this.exec(args);

    return result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({
        name,

        driver: name.toUpperCase().includes("TWAIN")
          ? "twain"
          : name.toUpperCase().includes("WIA")
            ? "wia"
            : name.toUpperCase().includes("SANE")
              ? "sane"
              : name.toUpperCase().includes("ESCL")
                ? "escl"
                : name.toUpperCase().includes("APPLE")
                  ? "apple"
                  : driver,
      }));
  }

  async scan(options = {}) {
    const args = [];

    args.push("--output", options.output);

    if (options.device) args.push("--device", options.device);

    args.push("--driver", options.driver || this.defaultDriver());

    if (options.dpi) args.push("--dpi", options.dpi);

    if (options.source) args.push("--source", options.source);

    if (options.bitdepth) args.push("--bitdepth", options.bitdepth);

    if (options.profile) args.push("--profile", options.profile);

    args.push("--force");

    return await this.exec(args);
  }
}

module.exports = new Naps2Engine();
