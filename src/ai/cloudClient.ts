/**
 * Cloud AI client — streams completions from the Suri server proxy.
 *
 * The proxy (supabase/functions/suri-ai-proxy) holds the provider keys and runs
 * the Gemini → Groq → OpenRouter failover cascade. The client's job is now tiny:
 * open ONE Server-Sent-Events stream to the proxy, send the messages (the system
 * prompt already carries the MELC RAG context), and emit tokens as they arrive.
 * No API keys, no client-side provider cascade.
 *
 * The fetch implementation is injectable. The default is Expo's streaming-capable
 * fetch (`expo/fetch`), loaded lazily so this module imports cleanly outside a
 * React Native runtime (e.g. headless verification with a mock fetch).
 */
import { SSEStreamParser } from './sse';
import { getProxyConfig } from './providerConfig';

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

export interface StreamProxyOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  onToken?: (delta: string) => void;
  signal?: AbortSignal;
  /** Abort if the request stalls this long (ms). Default 20s. */
  timeoutMs?: number;
  /** Override the fetch implementation (default: expo/fetch). */
  fetchImpl?: FetchLike;
}

/** HTTP-level error from the proxy (carries the status for the caller). */
export class ProxyHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProxyHttpError';
    this.status = status;
  }
}

/** Thrown when EXPO_PUBLIC_PROXY_URL / _TOKEN are not set in this build. */
export class ProxyNotConfiguredError extends Error {
  constructor() {
    super(
      'Cloud proxy not configured: set EXPO_PUBLIC_PROXY_URL and EXPO_PUBLIC_PROXY_TOKEN.',
    );
    this.name = 'ProxyNotConfiguredError';
  }
}

/**
 * Stream a chat completion from the proxy, invoking onToken for each delta and
 * resolving with the full concatenated text.
 *
 * @throws ProxyNotConfiguredError when the proxy URL/token are missing.
 * @throws ProxyHttpError on a non-2xx response (so callers can degrade offline).
 */
export async function streamProxyResponse(options: StreamProxyOptions): Promise<string> {
  const {
    messages,
    maxTokens,
    temperature,
    onToken,
    signal,
    timeoutMs = 20000,
  } = options;

  const config = getProxyConfig();
  if (!config) {
    throw new ProxyNotConfiguredError();
  }

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
    const response = await fetchImpl(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        // Supabase gateway wants both; for a custom proxy either is fine.
        Authorization: `Bearer ${config.token}`,
        apikey: config.token,
      },
      body: JSON.stringify({
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
      throw new ProxyHttpError(
        response.status,
        `Proxy HTTP ${response.status} ${response.statusText ?? ''} ${truncate(detail)}`.trim(),
      );
    }
    if (!response.body) {
      throw new Error('Streaming not supported: proxy response body is null.');
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
