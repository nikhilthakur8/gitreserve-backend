import pino from "pino";

export const logger = pino({
  name: "gitreserve",
  level: process.env["LOG_LEVEL"] ?? "info",
});

export function createChildLogger(module: string) {
  return logger.child({ module });
}
