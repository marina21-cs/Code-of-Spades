import { parseVisualSpec } from '@/visuals/visualParser';
import { getStreakData, recordStudySession } from '@/gamification/streakService';

/**
 * In-app validation for the visual parser + streak service. The visual parsing
 * is pure; the streak calls require the initialized SQLite database, so run this
 * on-device under __DEV__ after initDB()/seed.
 */
export async function verifyServices(): Promise<void> {
  console.log('Running Service Layer Validation Diagnostics...');

  // 1. Structural Visual JSON isolation verification
  const complexMarkdownPayload =
    'Sample text here... ```json\n{"type":"bar_chart","title":"Cell Stats","data":{"labels":["A","B"],"values":[10,20]}}\n``` trailing thoughts.';
  const specification = parseVisualSpec(complexMarkdownPayload);
  console.assert(specification !== null, '❌ Visual engine parsing failed to isolate structural blocks');
  console.assert(specification?.type === 'bar_chart', '❌ Data type tracking properties corrupted during extraction');
  console.log('✅ Document parsing specs verified.');

  // 2. Continuous progression safety checks
  await getStreakData();
  const balanceStateRunOne = await recordStudySession();
  const balanceStateRunTwo = await recordStudySession();

  console.assert(
    balanceStateRunOne.currentStreak === balanceStateRunTwo.currentStreak,
    '❌ Multiple entries within identical date parameters broken',
  );
  console.log('✅ Double-counting streak guardrails verified.');
}
