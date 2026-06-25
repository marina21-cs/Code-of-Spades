/**
 * Markdown -> plain speech cleanup (pure).
 *
 * TTS engines read punctuation and markdown literally ("hash hash", "star star"),
 * which sounds wrong. This strips formatting syntax and non-spoken blocks (code,
 * visual JSON specs) so expo-speech reads clean prose. No imports -> testable.
 */

/** Remove markdown/formatting so the result reads naturally aloud. */
export function cleanMarkdownForSpeech(input: string): string {
  if (!input) {
    return '';
  }

  let text = input;

  // Drop fenced code / visual-spec blocks entirely — never read JSON aloud.
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // Inline code: keep the words, drop the backticks.
  text = text.replace(/`([^`]*)`/g, '$1');

  // Images: ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Links: [text](url) -> text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Headings: leading # symbols.
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');

  // Blockquotes.
  text = text.replace(/^\s{0,3}>\s?/gm, '');

  // Unordered list markers (-, *, +) and ordered list markers (1.).
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // Bold / italic / strikethrough emphasis markers.
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/~~(.*?)~~/g, '$1');

  // Table pipes and separator rows.
  text = text.replace(/^\s*\|?[\s:-]*\|[\s:|-]*$/gm, ' ');
  text = text.replace(/\|/g, ' ');

  // Horizontal rules.
  text = text.replace(/^\s*([-*_])\1{2,}\s*$/gm, ' ');

  // Any stray heading/emphasis characters left behind.
  text = text.replace(/[#*_`>]/g, '');

  // Collapse whitespace.
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\s*\n\s*/g, '\n');
  text = text.replace(/\n{2,}/g, '\n');

  return text.trim();
}
