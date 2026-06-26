/**
 * Network signal tiering (spec 5.2) using @react-native-community/netinfo.
 *
 * Maps the device's connectivity to one of three tiers that drive routing:
 *   strong  -> Tier 1 (wifi/ethernet or 4g/5g): full payload + cloud cascade
 *   weak    -> Tier 2 (2g/3g): reduced payload, cloud cascade
 *   offline -> Tier 3 (no connection): cache + on-device SLM
 *
 * classifyNetwork() is pure (testable headlessly). The netinfo module is loaded
 * lazily inside the async helpers so this file can be imported in non-RN
 * contexts (e.g. verification) without pulling the native module.
 */

export type NetworkTier = 'strong' | 'weak' | 'offline';

/**
 * Developer/QA override (spec: Dev Tools "Force Offline Mode"). When enabled,
 * the router behaves as if the device were fully offline (Tier 3 / on-device
 * SLM) regardless of the real connection — without toggling Wi-Fi. The flag is
 * process-local and resets on reload; it is intended for __DEV__ testing only.
 */
let forceOffline = false;
const forceOfflineListeners = new Set<(value: boolean) => void>();

/** Whether the force-offline developer override is currently enabled. */
export function isForceOffline(): boolean {
  return forceOffline;
}

/** Enable/disable the force-offline developer override and notify subscribers. */
export function setForceOffline(value: boolean): void {
  if (forceOffline === value) {
    return;
  }
  forceOffline = value;
  for (const listener of forceOfflineListeners) {
    listener(value);
  }
}

/** Subscribe to force-offline override changes. Returns an unsubscribe function. */
export function subscribeForceOffline(listener: (value: boolean) => void): () => void {
  forceOfflineListeners.add(listener);
  return () => {
    forceOfflineListeners.delete(listener);
  };
}

/** Minimal connectivity snapshot decoupled from netinfo's concrete type. */
export interface NetworkSnapshot {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  cellularGeneration?: string | null;
}

/** Classify a connectivity snapshot into a routing tier. Pure. */
export function classifyNetwork(snapshot: NetworkSnapshot): NetworkTier {
  const { isConnected, isInternetReachable, type } = snapshot;

  if (type === 'none' || isConnected === false || isInternetReachable === false) {
    return 'offline';
  }
  if (type === 'wifi' || type === 'ethernet') {
    return 'strong';
  }
  if (type === 'cellular') {
    const generation = snapshot.cellularGeneration;
    if (generation === '2g' || generation === '3g') {
      return 'weak';
    }
    if (generation === '4g' || generation === '5g') {
      return 'strong';
    }
    // Unknown cellular generation: assume weak to keep payloads small.
    return 'weak';
  }
  // Connected via some other transport: trust reachability, else be cautious.
  return isInternetReachable === true ? 'strong' : 'weak';
}

function toSnapshot(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
  type?: string;
  details?: unknown;
}): NetworkSnapshot {
  const details = state.details;
  const cellularGeneration =
    details && typeof details === 'object' && 'cellularGeneration' in details
      ? ((details as { cellularGeneration?: string | null }).cellularGeneration ?? null)
      : null;
  return {
    isConnected: state.isConnected ?? null,
    isInternetReachable: state.isInternetReachable ?? null,
    type: state.type ?? 'unknown',
    cellularGeneration,
  };
}

/** One-shot read of the current network tier. */
export async function getNetworkTier(): Promise<NetworkTier> {
  // Developer override short-circuits real connectivity (Dev Tools).
  if (forceOffline) {
    return 'offline';
  }
  const { default: NetInfo } = await import('@react-native-community/netinfo');
  const state = await NetInfo.fetch();
  return classifyNetwork(toSnapshot(state));
}

/**
 * Subscribe to tier changes. Returns an unsubscribe function. Honors the
 * force-offline developer override: while enabled, every emission is 'offline',
 * and toggling the override re-emits the resolved tier immediately.
 */
export function subscribeNetworkTier(listener: (tier: NetworkTier) => void): () => void {
  let latest: NetworkTier = 'strong';
  let netinfoUnsub: () => void = () => {};

  const emit = (tier: NetworkTier): void => {
    latest = tier;
    listener(forceOffline ? 'offline' : tier);
  };

  void import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
    netinfoUnsub = NetInfo.addEventListener((state) => emit(classifyNetwork(toSnapshot(state))));
  });

  // Re-emit the resolved tier whenever the developer override flips.
  const forceUnsub = subscribeForceOffline(() => listener(forceOffline ? 'offline' : latest));

  return () => {
    netinfoUnsub();
    forceUnsub();
  };
}
