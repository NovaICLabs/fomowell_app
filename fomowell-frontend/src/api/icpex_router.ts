import { Principal } from '@dfinity/principal';
import type { ActorSubclass } from '@dfinity/agent';
import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { _SERVICE, Result_4, PoolInfo, RState } from '@/canisters/icpex_router/icpl_router.did';
import { idlFactory as icpexRrouterIdlFactory } from '@/canisters/icpex_router';
import dayjs from 'dayjs';
//swapTokenToToken
export type swapTokenToTokenType = {
  base_from_token: Principal;
  base_to_token: Principal;
  base_min_return_amount: bigint;
  base_from_amount: bigint | '';
  pairs: Principal[];
  directions: bigint;
  deadline: bigint;
};
let canisterId: string;
if (process.env.CANISTER_ID_ICPL_ROUTER) {
  canisterId = process.env.CANISTER_ID_ICPL_ROUTER;
  // console.log(canisterId);
} else if (process.env.ICPL_ROUTER_CANISTER_ID) {
  canisterId = process.env.ICPL_ROUTER_CANISTER_ID;
  // console.log(canisterId);
} else {
  console.error('No CANISTER_ID found in environment variables.');
}

export async function swapTokenToToken(Params: swapTokenToTokenType): Promise<Result_4> {
  console.log(Params);
  const newTimestamp = BigInt((new Date().getTime() + 10 ** 14) * 10 ** 5);
  Params.deadline = BigInt(newTimestamp);
  const Actor: _SERVICE = await createWalletActor(canisterId, icpexRrouterIdlFactory);
  return Actor.swapTokenToToken(
    ...[
      Params.base_from_token,
      Params.base_to_token,
      BigInt(Params.base_from_amount),
      Params.base_min_return_amount,
      Params.pairs,
      Params.directions,
      Params.deadline,
    ],
  );
}
//getPoolInfo
export async function getPoolInfo(Params: [Principal, Principal]): Promise<PoolInfo> {
  const Actor: _SERVICE = await createActor(canisterId, icpexRrouterIdlFactory);
  return Actor.getPoolInfo(...Params);
}
//getMidPrice
export async function getMidPrice(PoolId: Principal): Promise<bigint> {
  const Actor: _SERVICE = await createActor(canisterId, icpexRrouterIdlFactory);
  return Actor.getMidPrice(PoolId);
}
//querySellQuote
export async function querySellQuote(Params: [Principal, bigint]): Promise<[bigint, bigint, bigint, RState, bigint]> {
  const Actor: _SERVICE = await createActor(canisterId, icpexRrouterIdlFactory);
  return Actor.querySellQuote(...Params);
}
export async function querySellBase(Params: [Principal, bigint]): Promise<[bigint, bigint, bigint, RState, bigint]> {
  const Actor: _SERVICE = await createActor(canisterId, icpexRrouterIdlFactory);
  return Actor.querySellBase(...Params);
}
