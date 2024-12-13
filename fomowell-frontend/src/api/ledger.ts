import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  _SERVICE,
  AccountBalanceArgs,
  Tokens,
  TransferArgs,
  TransferFee,
  TransferFeeArg,
  TransferResult,
} from '@/canisters/ledger/ledger.did';
import { idlFactory } from '@/canisters/ledger';
export let canisterId: string;
if (process.env.CANISTER_ID_ICRC2_LEDGER) {
  canisterId = process.env.CANISTER_ID_ICRC2_LEDGER;
  // console.log(canisterId);
} else if (process.env.ICRC1_LEDGER_CANISTER_ID) {
  canisterId = process.env.ICRC1_LEDGER_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function transfer(Params: [TransferArgs]): Promise<TransferResult> {
  const Actor: _SERVICE = await createWalletActor('ryjl3-tyaaa-aaaaa-aaaba-cai', idlFactory);
  return Actor.transfer(...Params);
}
//transfer_fee
export async function transfer_fee(Params: [TransferFeeArg]): Promise<TransferFee> {
  const Actor = createActor<_SERVICE>('ryjl3-tyaaa-aaaaa-aaaba-cai', idlFactory);
  return Actor.transfer_fee(...Params);
}
//decimals
export async function decimals(): Promise<{ decimals: number }> {
  const Actor = createActor<_SERVICE>('ryjl3-tyaaa-aaaaa-aaaba-cai', idlFactory);
  return Actor.decimals();
}
//account_balance
export async function account_balance(params:[AccountBalanceArgs]): Promise<Tokens> {
    const Actor = createActor<_SERVICE>('ryjl3-tyaaa-aaaaa-aaaba-cai', idlFactory);
    return Actor.account_balance(...params);
  }
