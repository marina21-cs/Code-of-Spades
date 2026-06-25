/**
 * Registers the .ts extension resolve hook. Use via:
 *   node --import ./scripts/register-ts.mjs <script.mjs>
 */
import { register } from 'node:module';

register('./ts-extension-resolver.mjs', import.meta.url);
