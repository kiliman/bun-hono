import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

export const logger = pino({
  level: logLevel,
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
});
