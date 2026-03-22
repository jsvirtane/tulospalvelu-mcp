import { UpstreamError } from "./errors.js";

export type JsonObject = Record<string, unknown>;

export function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asObject(value: unknown, message = "Expected an object response."): JsonObject {
  if (!isObject(value)) {
    throw new Error(message);
  }

  return value;
}

export function objectArray(value: unknown): JsonObject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject);
}

export function stringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const stringValue = String(value).trim();

  if (!stringValue || stringValue === "null" || stringValue === "undefined") {
    return undefined;
  }

  if (stringValue === "0000-00-00 00:00:00") {
    return undefined;
  }

  return stringValue;
}

export function numberOrUndefined(value: unknown): number | undefined {
  const stringValue = stringOrUndefined(value);

  if (!stringValue) {
    return undefined;
  }

  const parsed = Number(stringValue);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function booleanFlagOrUndefined(value: unknown): boolean | undefined {
  if (value === true || value === "1" || value === 1) {
    return true;
  }

  if (value === false || value === "0" || value === 0) {
    return false;
  }

  return undefined;
}

export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => compact(item)).filter((item) => item !== undefined) as T;
  }

  if (isObject(value)) {
    const entries = Object.entries(value)
      .map(([key, entryValue]) => [key, compact(entryValue)] as const)
      .filter(([, entryValue]) => entryValue !== undefined);

    return Object.fromEntries(entries) as T;
  }

  if (value === null || value === undefined || value === "") {
    return undefined as T;
  }

  return value;
}

export function extractUpstreamError(value: unknown): string | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  const call = value.call;

  if (!isObject(call)) {
    return undefined;
  }

  return stringOrUndefined(call.error);
}

export function assertNoUpstreamError(value: unknown, endpoint: string): void {
  const errorMessage = extractUpstreamError(value);

  if (errorMessage) {
    throw new UpstreamError(errorMessage, { endpoint });
  }
}

export function extractCollection(value: unknown, key: string): JsonObject[] {
  if (Array.isArray(value)) {
    return objectArray(value);
  }

  const object = asObject(value);
  const collection = object[key];

  if (Array.isArray(collection)) {
    return objectArray(collection);
  }

  return [];
}

export function extractSingle(value: unknown, key: string): JsonObject {
  if (Array.isArray(value)) {
    const [firstItem] = objectArray(value);

    if (!firstItem) {
      throw new Error(`Expected a non-empty array for ${key}.`);
    }

    return firstItem;
  }

  const object = asObject(value);
  const keyedValue = object[key];

  if (Array.isArray(keyedValue)) {
    const [firstItem] = objectArray(keyedValue);

    if (!firstItem) {
      throw new Error(`Expected ${key} to contain at least one item.`);
    }

    return firstItem;
  }

  if (!isObject(keyedValue)) {
    throw new Error(`Expected ${key} to be an object.`);
  }

  return keyedValue;
}
