import { ConfigError } from "./errors.js";

const DEFAULT_BASE_URL = "https://spl.torneopal.net/taso/rest";
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export interface AppConfig {
  baseUrl: string;
  acceptHeaderValue: string;
  requestTimeoutMs: number;
  timezone: string;
}

function normalizeBaseUrl(value: string, variableName: string): string {
  const normalized = value.trim().replace(/\/+$/, "");

  try {
    const url = new URL(normalized);

    if (!url.protocol.startsWith("http")) {
      throw new Error("unsupported protocol");
    }

    return normalized;
  } catch {
    throw new ConfigError(`${variableName} must be a valid HTTP(S) URL.`);
  }
}

function readTimeout(variableName: string): number {
  const rawValue = process.env[variableName]?.trim();

  if (!rawValue) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ConfigError(`${variableName} must be a positive integer.`);
  }

  return parsed;
}

function readRequiredEnv(variableName: string): string {
  const value = process.env[variableName]?.trim();

  if (!value) {
    throw new ConfigError(`${variableName} is required.`);
  }

  return value;
}

export function loadConfig(): AppConfig {
  return {
    baseUrl: normalizeBaseUrl(process.env.PALLOLIITTO_BASE_URL ?? DEFAULT_BASE_URL, "PALLOLIITTO_BASE_URL"),
    acceptHeaderValue: readRequiredEnv("PALLOLIITTO_ACCEPT_HEADER"),
    requestTimeoutMs: readTimeout("PALLOLIITTO_REQUEST_TIMEOUT_MS"),
    timezone: "Europe/Helsinki",
  };
}
