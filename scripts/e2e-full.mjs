#!/usr/bin/env node
import { spawn } from "node:child_process";

const extra = process.argv.slice(2).filter((arg) => arg !== "--");

const child = spawn("playwright", ["test", ...extra], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, E2E_FULL: "1" },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
