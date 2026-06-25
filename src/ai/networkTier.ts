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
  details?: { cellularGeneration?: string | null } | null;
}): NetworkSnapshot {
  return {
    isConnected: state.isConnected ?? null,
    isInternetReachable: state.isInternetReachable ?? null,
    type: state.type ?? 'unknown',
    cellularGeneration: state.details?.cellularGeneration ?? null,
  };
}

/** One-shot read of the current network tier. */
export async function getNetworkTier(): Promise<NetworkTier> {
  const { default: NetInfo } = await import('@react-native-community/netinfo');
  const state = await NetInfo.fetch();
  return classifyNetwork(toSnapshot(state));
}

/** Subscribe to tier changes. Returns an unsubscribe function. */
export function subscribeNetworkTier(listener: (tier: NetworkTier) => void): () => void {
  let unsubscribe: () => void = () => {};
  void import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
    unsubscribe = NetInfo.addEventListener((state) => listener(classifyNetwork(toSnapshot(state))));
  });
  return () => unsubscribe();
}
