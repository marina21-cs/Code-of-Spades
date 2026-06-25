import { isModelDownloaded } from '@/ai/modelManager';
import { isSLMReady, runOfflineInference } from '@/ai/offlineSLM';
import { DEFAULT_PROFILE } from '@/profile/types';

/**
 * In-app offline-inference smoke test. Device-only: requires the downloaded
 * model + the llama.rn native binding. Run under __DEV__ after the model has
 * been downloaded. Console-logging validation engine, not a UI screen.
 */
export async function verifyOfflineInference(): Promise<void> {
  console.log('Initiating Offline Edge Execution Safety Audits...');

  const downloaded = await isModelDownloaded();
  if (!downloaded) {
    console.warn('⚠️ Base binary not resolved locally. Initiate downloadManager streams first.');
    return;
  }

  await runOfflineInference({
    message: 'What are the parts of a plant cell?',
    profile: { ...DEFAULT_PROFILE, gradeLevel: 6 },
    onToken: (t) => console.log('[SLM EDGE TOKEN]:', t),
    onDone: (full) => {
      console.log('\n[OFFLINE INFERENCE CYCLE COMPLETE]');
      console.assert(full.length > 0, '❌ Inference returned empty result tokens');
      console.assert(isSLMReady() === true, '❌ Engine state context dropped');
    },
  });
}
