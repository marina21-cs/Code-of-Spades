/**
 * ChatML prompt formatting for SmolLM2-Instruct (pure).
 *
 * SmolLM2-Instruct is trained with the ChatML template, delimiting turns with
 * <|im_start|>{role}\n...<|im_end|>. We build the prompt explicitly (rather than
 * relying on the GGUF's embedded template) for deterministic control and to set
 * matching stop tokens.
 */

export const IM_START = '<|im_start|>';
export const IM_END = '<|im_end|>';

/** Stop sequences that terminate generation for SmolLM2 ChatML. */
export const SLM_STOP_WORDS = [IM_END, '<|endoftext|>', IM_START];

/**
 * Build a single-turn ChatML prompt with a system instruction and user message,
 * leaving the assistant turn open for generation.
 */
export function formatChatML(system: string, user: string): string {
  return (
    `${IM_START}system\n${system}${IM_END}\n` +
    `${IM_START}user\n${user}${IM_END}\n` +
    `${IM_START}assistant\n`
  );
}
