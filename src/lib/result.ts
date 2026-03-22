import { ConfigError, InputError, UpstreamError } from "./errors.js";

type StructuredPayload = Record<string, unknown>;

function serializePayload(payload: StructuredPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function successResult<T extends StructuredPayload>(payload: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: serializePayload(payload),
      },
    ],
    structuredContent: payload,
  };
}

export function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error.";
  const type =
    error instanceof ConfigError
      ? "config_error"
      : error instanceof InputError
        ? "input_error"
        : error instanceof UpstreamError
          ? "upstream_error"
          : "internal_error";

  const payload = {
    error: {
      type,
      message,
    },
  };

  return {
    content: [
      {
        type: "text" as const,
        text: serializePayload(payload),
      },
    ],
    structuredContent: payload,
    isError: true,
  };
}
