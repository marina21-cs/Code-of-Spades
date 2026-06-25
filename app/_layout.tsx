import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { initDB } from '@/db/database';
import { seedMELCs } from '@/db/ragStore';
import { maybeRegisterSLM } from '@/ai/offlineSLM';
import { verifyDB } from '@/db/verifyDB';
import { verifyRAG } from '@/db/verifyRAG';

type InitState =
  | { phase: 'loading' }
  | { phase: 'ready' }
  | { phase: 'error'; error: Error };

/**
 * Root layout. Owns a single, isolated database-initialization pipeline that
 * runs before any route is rendered, so every screen below <Slot /> can safely
 * assume getDB() returns a live, seeded connection.
 *
 * Loading and failure are handled here explicitly rather than letting feature
 * screens each guard against an uninitialized database.
 */
export default function RootLayout() {
  const [state, setState] = useState<InitState>({ phase: 'loading' });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await initDB();
        // Seed the bundled MELC curriculum (idempotent — no-op if present).
        await seedMELCs();
        // If the offline SLM is already downloaded, wire it in as the router's
        // Tier-3 runner. No-op (keeps the extractive fallback) otherwise.
        await maybeRegisterSLM();
        // Headless validation in development only — never ships to students.
        if (__DEV__) {
          await verifyDB();
          await verifyRAG();
        }
        if (mounted) {
          setState({ phase: 'ready' });
        }
      } catch (error) {
        if (mounted) {
          setState({ phase: 'error', error: error as Error });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (state.phase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn&apos;t prepare local storage</Text>
        <Text style={styles.detail}>{state.error.message}</Text>
      </View>
    );
  }

  if (state.phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.detail}>Preparing your offline study companion…</Text>
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  detail: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
