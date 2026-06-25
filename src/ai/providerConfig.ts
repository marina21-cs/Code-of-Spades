/**
 * Cloud provider configuration + secure API-key storage.
 *
 * All three providers expose the SAME OpenAI-compatible chat-completions API,
 * so they differ only by base URL, model id, and key (spec 5.2 / 10). Keys live
 * in expo-secure-store (encrypted at rest) and can be rotated without an app
 * update. Keys are NEVER hardcoded or logged.
 */
import * as SecureStore from 'expo-secure-store';

export type ProviderId = 'gemini' | 'groq' | 'openrouter';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  /** OpenAI-compatible base URL; client appends /chat/completions. */
  baseURL: string;
  /** Default model id for this provider. */
  model: string;
  /** expo-secure-store key under which the API key is stored. */
  apiKeyName: string;
  /** Documented free-tier limits (informational; June 2026). */
  limits: { rpm: number; rpd: number };
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    label: 'Gemini 3 Flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3-flash',
    apiKeyName: 'suri.apikey.gemini',
    limits: { rpm: 10, rpd: 1500 },
  },
  groq: {
    id: 'groq',
    label: 'Groq Llama 3.1 8B Instant',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    apiKeyName: 'suri.apikey.groq',
    limits: { rpm: 30, rpd: 14400 },
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter DeepSeek V3',
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-v3-0324:free',
    apiKeyName: 'suri.apikey.openrouter',
    limits: { rpm: 20, rpd: 200 },
  },
};

/** Failover order: primary -> fallback 1 -> fallback 2. */
export const PROVIDER_CASCADE: ProviderId[] = ['gemini', 'groq', 'openrouter'];

/** Persist an API key for a provider. Trimmed; empty input clears the key. */
export async function setApiKey(provider: ProviderId, key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    await clearApiKey(provider);
    return;
  }
  await SecureStore.setItemAsync(PROVIDERS[provider].apiKeyName, trimmed);
}

/** Read a stored API key, or null if none is set. */
export async function getApiKey(provider: ProviderId): Promise<string | null> {
  return SecureStore.getItemAsync(PROVIDERS[provider].apiKeyName);
}

/** Remove a stored API key. */
export async function clearApiKey(provider: ProviderId): Promise<void> {
  await SecureStore.deleteItemAsync(PROVIDERS[provider].apiKeyName);
}

/** Providers that currently have a key, in cascade order. */
export async function getConfiguredProviders(): Promise<ProviderId[]> {
  const configured: ProviderId[] = [];
  for (const id of PROVIDER_CASCADE) {
    // Sequential on purpose: SecureStore reads are cheap and ordering matters.
    // eslint-disable-next-line no-await-in-loop
    const key = await getApiKey(id);
    if (key) {
      configured.push(id);
    }
  }
  return configured;
}
