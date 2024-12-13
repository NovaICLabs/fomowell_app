import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { _SERVICE, SwapTxRecord } from '@/canisters/icpex_transactions/icpl_transactions.did';
import { idlFactory } from '@/canisters/icpex_transactions';
export let canisterId: string;
if (process.env.CANISTER_ID_ICPL_TRANSACTIONS) {
  canisterId = process.env.CANISTER_ID_ICPL_TRANSACTIONS;
} else if (process.env.ICPL_TRANSACTIONS_CANISTER_ID) {
  canisterId = process.env.ICPL_TRANSACTIONS_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function querySwapStatusStr(Param: string): Promise<Array<SwapTxRecord>> {
  const Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.querySwapStatusStr(Param);
}
