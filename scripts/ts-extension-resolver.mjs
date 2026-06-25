/**
 * Node ESM resolve hook: lets extensionless relative imports (e.g. './types')
 * resolve to their '.ts' file. Expo/Metro does this at bundle time; this hook
 * gives the headless Node verification scripts the same behaviour without
 * forcing non-idiomatic '.ts' extensions into the app source.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HAS_KNOWN_EXTENSION = /\.([cm]?[jt]sx?|json|node)$/i;

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !HAS_KNOWN_EXTENSION.test(specifier)) {
    try {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(candidate.href, context);
      }
    } catch {
      // fall through to default resolution
    }
  }
  return nextResolve(specifier, context);
}
