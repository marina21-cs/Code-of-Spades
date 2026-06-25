/**
 * Pure Server-Sent Events parser for OpenAI-compatible chat streams.
 *
 * The cloud providers (Gemini, Groq, OpenRouter) all return the same SSE shape:
 *   data: {"choices":[{"delta":{"content":"..."}}]}\n\n
 *   data: [DONE]\n\n
 *
 * Network reads arrive as arbitrary byte chunks that can split a line anywhere,
 * so this parser buffers across pushes and only emits an event once a full line
 * (terminated by \n) is available. No imports -> fully unit-testable headlessly.
 */

export type SSEEvent =
  | { type: 'token'; value: string }
  | { type: 'done' };

export class SSEStreamParser {
  private buffer = '';
  private finished = false;

  /** Feed a decoded text chunk; returns any events completed by this chunk. */
  push(chunk: string): SSEEvent[] {
    if (this.finished) {
      return [];
    }
    this.buffer += chunk;
    const events: SSEEvent[] = [];

    let newlineIndex = this.buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const rawLine = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      const event = this.parseLine(rawLine);
      if (event) {
        events.push(event);
        if (event.type === 'done') {
          this.finished = true;
          this.buffer = '';
          return events;
        }
      }
      newlineIndex = this.buffer.indexOf('\n');
    }
    return events;
  }

  /**
   * Emit any trailing buffered line once the stream ends without a final
   * newline. A dangling [DONE] is irrelevant at end-of-stream, so only token
   * events are returned here.
   */
  flush(): SSEEvent[] {
    if (this.finished || !this.buffer) {
      return [];
    }
    const event = this.parseLine(this.buffer);
    this.buffer = '';
    return event && event.type === 'token' ? [event] : [];
  }

  private parseLine(rawLine: string): SSEEvent | null {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const trimmed = line.trim();

    // Blank lines and SSE comments/keepalives carry no payload.
    if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) {
      return null;
    }

    const data = trimmed.slice('data:'.length).trim();
    if (data === '[DONE]') {
      return { type: 'done' };
    }

    const delta = extractDelta(data);
    return delta ? { type: 'token', value: delta } : null;
  }
}

/** Extract the incremental text from one OpenAI-compatible data payload. */
export function extractDelta(jsonPayload: string): string | null {
  try {
    const parsed = JSON.parse(jsonPayload) as {
      choices?: Array<{ delta?: { content?: string }; text?: string }>;
    };
    const choice = parsed.choices?.[0];
    const content = choice?.delta?.content ?? choice?.text;
    return typeof content === 'string' && content.length > 0 ? content : null;
  } catch {
    // Partial or non-JSON line (e.g. a keepalive); ignore safely.
    return null;
  }
}
