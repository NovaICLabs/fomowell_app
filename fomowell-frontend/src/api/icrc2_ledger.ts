import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { MetadataValue, _SERVICE, Account, TransferArg, Result } from '@/canisters/icrc2_ledger/icrc2_ledger.did';
import { idlFactory } from '@/canisters/icrc2_ledger';
export let canisterId: string;
if (process.env.CANISTER_ID_ICRC2_LEDGER) {
  canisterId = process.env.CANISTER_ID_ICRC2_LEDGER;
  // console.log(canisterId);
} else if (process.env.ICRC1_LEDGER_CANISTER_ID) {
  canisterId = process.env.ICRC1_LEDGER_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}

export async function icrc1_metadata(canisterIdParams?: string): Promise<Array<[string, MetadataValue]>> {
  let Actor;
  if (canisterIdParams) {
    Actor = createActor<_SERVICE>(canisterIdParams, idlFactory);
    return Actor.icrc1_metadata();
  }
  Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_metadata();
}
export async function icrc1_symbol(canisterIdParams?: string): Promise<string> {
  let Actor;
  if (canisterIdParams) {
    Actor = createActor<_SERVICE>(canisterIdParams, idlFactory);
    return Actor.icrc1_symbol();
  }
  Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_symbol();
}
//decimals
export async function icrc1_decimals(): Promise<number> {
  const Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_decimals();
}
//icrc1balance
export async function icrc1balance(Params: [Account], canisterIdParams?: string): Promise<bigint> {
  let Actor;
  if (canisterIdParams) {
    Actor = createActor<_SERVICE>(canisterIdParams, idlFactory);
  } else {
    Actor = createActor<_SERVICE>(canisterId, idlFactory);
  }
  return Actor.icrc1_balance_of(...Params);
}
//icrc_plus_cycles
export async function icrc_plus_cycles(canisterId: string): Promise<bigint> {
  const Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc_plus_cycles();
}
export async function icrc1_transfer(canisterId: string, params: TransferArg): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.icrc1_transfer(params);
}
//icrc1_fee
export async function icrc1_fee(canisterId: string): Promise<bigint> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.icrc1_fee();
}
// icrc1_decimals
export async function icrc1_decimals_token(canisterId: string): Promise<number> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.icrc1_decimals();
}
