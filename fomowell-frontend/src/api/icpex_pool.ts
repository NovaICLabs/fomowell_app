import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { _SERVICE } from '@/canisters/icpex_pool/icpex_pool.did';
import { idlFactory } from '@/canisters/icpex_pool/icpex_pool.did';
export async function icpex_pool_cycles(canisterId: string): Promise<bigint> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.cycles();
}
