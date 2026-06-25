/**
 * Reusable SSE streaming client for OpenAI-compatible chat completions.
 *
 * One implementation serves all three providers — only baseURL/apiKey/model
 * differ. Bytes are read from the streaming response, decoded, and fed through
 * the pure SSEStreamParser to emit tokens as they arrive.
 *
 * The fetch implementation is injectable. The default is Expo's streaming-capable
 * fetch (`expo/fetch`), loaded lazily so this module imports cleanly outside a
 * React Native runtime (e.g. for headless verification with a mock fetch).
 */
import { SSEStreamParser } from './sse';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Structural subset of fetch we rely on (keeps us decoupled from lib types). */
export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<StreamResponseLike>;

export interface StreamResponseLike {
  ok: boolean;
  status: number;
  statusText?: string;
  text: () => Promise<string>;
  body:
    | {
        getReader: () => {
          read: () => Promise<{ value?: Uint8Array; done: boolean }>;
        };
      }
    | null;
}

export interface StreamChatOptions {
  baseURL: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  onToken?: (delta: string) => void;
  signal?: AbortSignal;
  /** Abort if the request stalls this long (ms). Default 20s. */
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
  /** Override the fetch implementation (default: expo/fetch). */
  fetchImpl?: FetchLike;
}

/** HTTP-level provider error carrying the status so the cascade can react. */
export class ProviderHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProviderHttpError';
    this.status = status;
  }
}

/**
 * Stream a chat completion, invoking onToken for each delta and resolving with
 * the full concatenated text. Throws ProviderHttpError on non-2xx so the router
 * can fail over to the next provider.
 */
export async function streamChatCompletion(options: StreamChatOptions): Promise<string> {
  const {
    baseURL,
    apiKey,
    model,
    messages,
    maxTokens = 800,
    temperature = 0.4,
    onToken,
    signal,
    timeoutMs = 20000,
    extraHeaders,
  } = options;

  const fetchImpl = options.fetchImpl ?? (await resolveDefaultFetch());

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortFromCaller);
    }
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${apiKey}`,
        ...(extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {
        // ignore secondary failure reading the error body
      }
      throw new ProviderHttpError(
        response.status,
        `HTTP ${response.status} ${response.statusText ?? ''} ${truncate(detail)}`.trim(),
      );
    }
    if (!response.body) {
      throw new Error('Streaming not supported: response body is null.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = new SSEStreamParser();
    let full = '';

    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      const text = decoder.decode(value, { stream: true });
      let streamEnded = false;
      for (const event of parser.push(text)) {
        if (event.type === 'done') {
          streamEnded = true;
          break;
        }
        full += event.value;
        onToken?.(event.value);
      }
      if (streamEnded) {
        break;
      }
    }

    for (const event of parser.flush()) {
      if (event.type === 'token') {
        full += event.value;
        onToken?.(event.value);
      }
    }

    return full;
  } finally {
    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener('abort', abortFromCaller);
    }
  }
}

async function resolveDefaultFetch(): Promise<FetchLike> {
  // Expo's streaming-capable fetch. Lazy import keeps this module loadable
  // outside React Native (verification injects its own fetch).
  const mod = (await import('expo/fetch')) as unknown as { fetch: FetchLike };
  return mod.fetch;
}

function truncate(value: string, max = 200): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
