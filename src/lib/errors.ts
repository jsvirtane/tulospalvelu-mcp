export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export class UpstreamError extends Error {
  readonly endpoint: string;
  readonly statusCode?: number;

  constructor(message: string, options: { endpoint: string; statusCode?: number }) {
    super(message);
    this.name = "UpstreamError";
    this.endpoint = options.endpoint;
    this.statusCode = options.statusCode;
  }
}
