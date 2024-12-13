import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  _SERVICE,
  Account,
  BlockIndex,
  DepositArgs,
  DepositResult,
  WithdrawArgs,
  WithdrawError,
  WithdrawFromArgs,
  WithdrawFromError,
} from '@/canisters/cycles_ledger/cycles_ledger.did';
import { idlFactory } from '@/canisters/cycles_ledger/cycles_ledger.did';
export let canisterId: string;
if (process.env.CANISTER_ID_CYCLES_LEDGER) {
  canisterId = process.env.CANISTER_ID_CYCLES_LEDGER;
  // console.log(canisterId);
} else if (process.env.CYCLES_LEDGER_CANISTER_ID) {
  canisterId = process.env.CYCLES_LEDGER_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function icrc1_balance_of(Params: [Account]): Promise<bigint> {
  const Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_balance_of(...Params);
}

export async function deposit(Params: [DepositArgs]): Promise<DepositResult> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.deposit(...Params);
}
//withdraw
export async function withdraw(Params: [WithdrawArgs]): Promise<{ Ok: BlockIndex } | { Err: WithdrawError }> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.withdraw(...Params);
}
//icrc1_fee
export async function icrc1_fee(): Promise<bigint> {
  const Actor = createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_fee();
}
export async function withdraw_from(
  params: [WithdrawFromArgs],
): Promise<{ Ok: BlockIndex } | { Err: WithdrawFromError }> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.withdraw_from(...params);
}
